#!/usr/bin/env python3
"""
Validador de URLs para Equipo Normativas.
Verifica accesibilidad de PDFs normativos y busca alternativas automáticamente:
  1. Validación técnica (HEAD → GET con fallback SSL permisivo)
  2. Reintento anti-bot con headers alternativos
  3. Consulta Wayback Machine para URLs rotas
  4. Heurística para dominios gubernamentales con bloqueo de bots
"""

import sys
import io
import json
import urllib.request
import urllib.error
import urllib.parse
import ssl
import time
from typing import Dict, List, Optional

# Forzar UTF-8 en stdout/stderr para compatibilidad con emojis en Windows
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# ---------------------------------------------------------------------------
# Constantes
# ---------------------------------------------------------------------------

TIMEOUT_DEFECTO = 15
MAX_REINTENTOS = 3
PAUSA_ENTRE_URLS = 0.75

HEADERS_NORMAL = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "application/pdf,application/octet-stream,text/html,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
}

# Headers simulando visita orgánica desde Google (evita algunos anti-bot)
HEADERS_ANTI_BOT = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,application/pdf,*/*;q=0.8",
    "Accept-Language": "es-ES,es;q=0.9,en;q=0.8",
    "Referer": "https://www.google.com/",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "cross-site",
    "Cache-Control": "no-cache",
}

TIPOS_DESCARGABLES = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument",
    "application/octet-stream",
    "application/zip",
]

# Dominios conocidos por bloquear bots pero accesibles en navegador.
# Un 403 en estos dominios se clasifica como ⚠️ (anti-bot) en lugar de ❌.
DOMINIOS_ANTI_BOT = {
    "asp.salud.gob.sv",
    "anda.gob.sv",
    "conaipd.gob.sv",
    "iris.paho.org",
    "oas.org",
    "minsal.gob.sv",
    "salud.gob.sv",
    "mtps.gob.sv",
    "siget.gob.sv",
    "mop.gob.sv",
    "marn.gob.sv",
    "ambiente.gob.sv",
    "bomberos.gob.sv",
    "sc.gob.sv",
    "transparencia.gob.sv",
    "cssp.gob.sv",
    "usam.salud.gob.sv",
    "asa.gob.sv",
    "opamss.org.sv",
    "redicces.org.sv",
    "nfpa.org",
    "iso.org",
    "iec.ch",
    "concrete.org",
    "iadb.org",
    "publications.iadb.org",
    "bibliocad.com",
    "webstore.iec.ch",
}

WAYBACK_API = "https://archive.org/wayback/available?url={url}"


# ---------------------------------------------------------------------------
# Utilidades
# ---------------------------------------------------------------------------

def crear_contexto_ssl() -> ssl.SSLContext:
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    return ctx


def dominio_de(url: str) -> str:
    try:
        return urllib.parse.urlparse(url).netloc.lower().lstrip("www.")
    except Exception:
        return ""


def es_dominio_anti_bot(url: str) -> bool:
    d = dominio_de(url)
    return any(d == dom or d.endswith("." + dom) for dom in DOMINIOS_ANTI_BOT)


# ---------------------------------------------------------------------------
# Validación HTTP
# ---------------------------------------------------------------------------

def _intentar_request(url: str, metodo: str, headers: dict, timeout: int) -> Optional[Dict]:
    """Realiza una petición HTTP y devuelve resultado o None si falla."""
    ssl_ctx = crear_contexto_ssl()
    try:
        req = urllib.request.Request(url, method=metodo, headers=headers)
        with urllib.request.urlopen(req, timeout=timeout, context=ssl_ctx) as resp:
            ct = resp.headers.get("Content-Type", "").lower()
            cl = resp.headers.get("Content-Length")
            return {
                "estado_http": resp.status,
                "tipo_contenido": ct,
                "tamano_bytes": int(cl) if cl else None,
                "metodo_usado": metodo,
                "error": None,
            }
    except urllib.error.HTTPError as e:
        if e.code == 405 and metodo == "HEAD":
            return None  # Reintentar con GET
        return {"estado_http": e.code, "error": f"HTTP {e.code}: {e.reason}",
                "tipo_contenido": None, "tamano_bytes": None, "metodo_usado": metodo}
    except urllib.error.URLError as e:
        return {"estado_http": None, "error": str(e.reason)[:120],
                "tipo_contenido": None, "tamano_bytes": None, "metodo_usado": metodo}
    except TimeoutError:
        return {"estado_http": None, "error": "Timeout: el servidor no respondió",
                "tipo_contenido": None, "tamano_bytes": None, "metodo_usado": metodo}
    except Exception as e:
        return {"estado_http": None, "error": str(e)[:120],
                "tipo_contenido": None, "tamano_bytes": None, "metodo_usado": metodo}


def validar_url_http(url: str, timeout: int = TIMEOUT_DEFECTO) -> Dict:
    """
    Intenta HEAD → GET con headers normales; si falla, reintenta con headers anti-bot.
    Devuelve dict con campos de resultado HTTP.
    """
    # Secuencia: HEAD normal, GET normal, GET anti-bot
    intentos = [
        ("HEAD", HEADERS_NORMAL),
        ("GET", HEADERS_NORMAL),
        ("GET", HEADERS_ANTI_BOT),
    ]
    ultimo = None
    for metodo, headers in intentos:
        r = _intentar_request(url, metodo, headers, timeout)
        if r is None:
            continue  # 405 en HEAD → pasar a GET
        ultimo = r
        if r["estado_http"] and r["estado_http"] in (200, 206):
            break  # Éxito
        # 403 con headers normales → intentar anti-bot
        if r["estado_http"] == 403 and headers is HEADERS_NORMAL:
            continue
        break

    return ultimo or {
        "estado_http": None, "error": "Sin respuesta tras todos los intentos",
        "tipo_contenido": None, "tamano_bytes": None, "metodo_usado": None,
    }


# ---------------------------------------------------------------------------
# Wayback Machine
# ---------------------------------------------------------------------------

def buscar_en_wayback(url: str, timeout: int = 10) -> Optional[str]:
    """
    Consulta la API de Wayback Machine para encontrar la versión archivada más
    reciente de una URL rota. Devuelve la URL de archivo o None.
    """
    api_url = WAYBACK_API.format(url=urllib.parse.quote(url, safe="/:?=&"))
    try:
        req = urllib.request.Request(api_url, headers={"User-Agent": HEADERS_NORMAL["User-Agent"]})
        ssl_ctx = crear_contexto_ssl()
        with urllib.request.urlopen(req, timeout=timeout, context=ssl_ctx) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            snapshot = data.get("archived_snapshots", {}).get("closest", {})
            if snapshot.get("available") and snapshot.get("url"):
                return snapshot["url"]
    except Exception:
        pass
    return None


# ---------------------------------------------------------------------------
# Validación completa con búsqueda de alternativas
# ---------------------------------------------------------------------------

def validar_url(url: str, timeout: int = TIMEOUT_DEFECTO) -> Dict:
    """
    Valida una URL con búsqueda automática de alternativas:
    1. Validación HTTP (HEAD/GET, anti-bot headers)
    2. Si ❌ → Wayback Machine fallback
    3. Heurística de dominio anti-bot para ⚠️ correctos
    """
    resultado = {
        "url": url,
        "url_validada": url,
        "url_alternativa_buscada": False,
        "estado_http": None,
        "tipo_contenido": None,
        "tamano_bytes": None,
        "es_pdf": False,
        "descargable": False,
        "valido": False,
        "error": None,
        "indicador": "❌",
        "metodo_usado": None,
        "nota_validacion": "",
    }

    if not url or not url.startswith(("http://", "https://")):
        resultado["error"] = "URL no válida o vacía"
        resultado["nota_validacion"] = "URL no válida o vacía"
        return resultado

    # --- Paso 1: Validación HTTP ---
    r = validar_url_http(url, timeout)
    resultado.update({
        "estado_http": r["estado_http"],
        "tipo_contenido": r["tipo_contenido"],
        "tamano_bytes": r["tamano_bytes"],
        "metodo_usado": r["metodo_usado"],
        "error": r.get("error"),
    })

    ct = r["tipo_contenido"] or ""
    resultado["es_pdf"] = "pdf" in ct
    resultado["descargable"] = any(t in ct for t in TIPOS_DESCARGABLES)
    resultado["valido"] = r["estado_http"] in (200, 206) if r["estado_http"] else False

    if resultado["valido"]:
        if resultado["es_pdf"] or resultado["descargable"]:
            resultado["indicador"] = "✅"
        else:
            resultado["indicador"] = "⚠️"
            resultado["nota_validacion"] = "URL accesible pero no devuelve PDF directo (página HTML o catálogo)."
        return resultado

    # --- Paso 2: Diagnóstico de fallo ---
    codigo = r["estado_http"]
    es_anti_bot = es_dominio_anti_bot(url)

    # 403 en dominio conocido por bloquear bots → ⚠️ (accesible en navegador)
    if codigo == 403 and es_anti_bot:
        resultado["indicador"] = "⚠️"
        resultado["nota_validacion"] = (
            "HTTP 403 — dominio bloquea peticiones automáticas. "
            "Documento accesible en navegador web."
        )
        return resultado

    # --- Paso 3: Wayback Machine para URLs rotas ---
    resultado["url_alternativa_buscada"] = True
    wayback_url = buscar_en_wayback(url, timeout=10)

    if wayback_url:
        # Verificar que la copia archivada también responde
        r_wb = validar_url_http(wayback_url, timeout=timeout)
        if r_wb.get("estado_http") in (200, 206):
            ct_wb = r_wb.get("tipo_contenido") or ""
            resultado["url_validada"] = wayback_url
            resultado["estado_http"] = r_wb["estado_http"]
            resultado["tipo_contenido"] = ct_wb
            resultado["tamano_bytes"] = r_wb.get("tamano_bytes")
            resultado["es_pdf"] = "pdf" in ct_wb
            resultado["descargable"] = any(t in ct_wb for t in TIPOS_DESCARGABLES)
            resultado["valido"] = True
            resultado["error"] = None
            resultado["indicador"] = "⚠️"
            resultado["nota_validacion"] = (
                f"URL original {'HTTP ' + str(codigo) if codigo else 'no disponible'}. "
                f"Alternativa automática: copia Wayback Machine."
            )
            return resultado

    # Sin alternativa disponible
    if codigo == 403 and not es_anti_bot:
        resultado["nota_validacion"] = "Acceso denegado (HTTP 403). Sin copia archivada disponible."
    elif codigo == 404:
        resultado["nota_validacion"] = "Recurso no encontrado (HTTP 404). Sin copia archivada disponible."
    elif r.get("error") and "Timeout" in r["error"]:
        resultado["nota_validacion"] = "El servidor no respondió (timeout). Sin copia archivada disponible."
    else:
        resultado["nota_validacion"] = (
            f"{'HTTP ' + str(codigo) + ' — ' if codigo else ''}"
            f"{r.get('error', 'Error desconocido')}. Sin alternativa encontrada."
        )

    return resultado


# ---------------------------------------------------------------------------
# Validación en lote
# ---------------------------------------------------------------------------

def validar_lista_urls(urls: List[str], pausa_segundos: float = PAUSA_ENTRE_URLS,
                        timeout: int = TIMEOUT_DEFECTO) -> List[Dict]:
    resultados = []
    total = len(urls)

    for i, url in enumerate(urls, 1):
        resultado = validar_url(url, timeout=timeout)
        resultados.append(resultado)

        estado = resultado.get("estado_http", "?")
        ct = (resultado.get("tipo_contenido") or "sin tipo")[:40]
        url_mostrada = url[:75]
        indicador = resultado["indicador"]
        alternativa = " [Wayback✓]" if resultado.get("url_alternativa_buscada") and resultado.get("url_validada") != url else ""
        antibot = " [anti-bot]" if "anti-bot" in resultado.get("nota_validacion", "") or "bloquea" in resultado.get("nota_validacion", "") else ""

        print(
            f"[{i:3d}/{total}] {indicador}{alternativa}{antibot}  "
            f"HTTP {estado}  |  {ct}  |  {url_mostrada}",
            file=sys.stderr,
            flush=True,
        )

        if i < total:
            time.sleep(pausa_segundos)

    return resultados


# ---------------------------------------------------------------------------
# Salida
# ---------------------------------------------------------------------------

def generar_tabla_markdown(resultados: List[Dict]) -> str:
    lineas = [
        "| # | URL | Estado HTTP | Tipo Contenido | Verificado | Nota |",
        "|---|-----|-------------|----------------|------------|------|",
    ]
    for i, r in enumerate(resultados, 1):
        url_mostrada = r["url_validada"] if r["url_validada"] != r["url"] else r["url"]
        if r.get("url_alternativa_buscada") and r["url_validada"] != r["url"]:
            url_celda = f"[Original]({r['url']}) → [Wayback]({r['url_validada']})"
        else:
            url_celda = url_mostrada[:80]

        estado = str(r["estado_http"]) if r["estado_http"] else "Error"
        ct = (r["tipo_contenido"] or r.get("error") or "desconocido")[:45]
        ind = r["indicador"]
        nota = r.get("nota_validacion", "")[:60]
        lineas.append(f"| {i} | {url_celda} | {estado} | {ct} | {ind} | {nota} |")

    validas = sum(1 for r in resultados if r["indicador"] == "✅")
    advertencia = sum(1 for r in resultados if r["indicador"] == "⚠️")
    no_disp = sum(1 for r in resultados if r["indicador"] == "❌")
    con_alternativa = sum(1 for r in resultados if r.get("url_alternativa_buscada") and r["url_validada"] != r["url"])
    anti_bot = sum(1 for r in resultados if "anti-bot" in r.get("nota_validacion", "") or "bloquea" in r.get("nota_validacion", ""))

    resumen = (
        f"\n**Resumen:** "
        f"{validas} válidos ✅ · "
        f"{advertencia} con advertencia ⚠️ · "
        f"{no_disp} no disponibles ❌  \n"
        f"_(De los ⚠️: {anti_bot} bloqueados por anti-bot, accesibles en navegador · "
        f"{con_alternativa} con alternativa Wayback Machine encontrada)_"
    )

    return "\n".join(lineas) + "\n" + resumen


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso:", file=sys.stderr)
        print("  python validate_urls.py <url1> [url2] ...", file=sys.stderr)
        print("  echo '[\"url1\",\"url2\"]' | python validate_urls.py --stdin", file=sys.stderr)
        print("  python validate_urls.py --stdin --markdown < urls.json", file=sys.stderr)
        print("  python validate_urls.py --timeout 20 <url>", file=sys.stderr)
        sys.exit(1)

    modo_markdown = "--markdown" in sys.argv

    timeout = TIMEOUT_DEFECTO
    if "--timeout" in sys.argv:
        idx = sys.argv.index("--timeout")
        if idx + 1 < len(sys.argv):
            try:
                timeout = int(sys.argv[idx + 1])
            except ValueError:
                pass

    if "--stdin" in sys.argv:
        datos = sys.stdin.read().strip()
        urls = json.loads(datos)
    else:
        urls = [a for a in sys.argv[1:] if not a.startswith("--") and not a.lstrip("-").isdigit()]

    if not urls:
        print("Error: no se proporcionaron URLs.", file=sys.stderr)
        sys.exit(1)

    resultados = validar_lista_urls(urls, timeout=timeout)

    if modo_markdown:
        print(generar_tabla_markdown(resultados))
    else:
        print(json.dumps(resultados, indent=2, ensure_ascii=False))
