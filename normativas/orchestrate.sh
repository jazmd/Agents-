#!/usr/bin/env bash
# Equipo Normativas — Punto de entrada del sistema multi-agente
# Uso: ./normativas/orchestrate.sh --pais "España" --region "Cataluña" --sector "Residencial"

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
OUTPUT_DIR="${SCRIPT_DIR}/output"

# ──────────────────────────────────────────────
# Parseo de argumentos
# ──────────────────────────────────────────────
PAIS=""
REGION=""
SECTOR=""
CIUDAD=""

mostrar_ayuda() {
    echo ""
    echo "  EQUIPO NORMATIVAS — Sistema Multi-Agente de Búsqueda Normativa"
    echo ""
    echo "  Uso: $0 --pais <país> --region <región> --sector <sector> [--ciudad <ciudad>]"
    echo ""
    echo "  Parámetros:"
    echo "    --pais    País donde se ubica el proyecto (obligatorio)"
    echo "    --region  Región, comunidad autónoma o estado (obligatorio)"
    echo "    --sector  Sector de uso del edificio (obligatorio)"
    echo "    --ciudad  Ciudad o municipio (opcional, mejora la búsqueda local)"
    echo ""
    echo "  Sectores disponibles:"
    echo "    Residencial · Comercial · Oficinas · Industrial · Sanitario"
    echo "    Educativo · Hotelero · Deportivo · Cultural · Mixto · Logístico"
    echo ""
    echo "  Ejemplos:"
    echo "    $0 --pais 'España' --region 'Cataluña' --sector 'Residencial' --ciudad 'Barcelona'"
    echo "    $0 --pais 'France' --region 'Île-de-France' --sector 'Commercial'"
    echo "    $0 --pais 'Germany' --region 'Bavaria' --sector 'Industrial'"
    echo ""
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --pais)    PAIS="$2";    shift 2 ;;
        --region)  REGION="$2";  shift 2 ;;
        --sector)  SECTOR="$2";  shift 2 ;;
        --ciudad)  CIUDAD="$2";  shift 2 ;;
        -h|--help) mostrar_ayuda; exit 0 ;;
        *) echo "❌  Opción desconocida: $1"; mostrar_ayuda; exit 1 ;;
    esac
done

if [[ -z "$PAIS" || -z "$REGION" || -z "$SECTOR" ]]; then
    echo "❌  Error: --pais, --region y --sector son obligatorios."
    mostrar_ayuda
    exit 1
fi

# ──────────────────────────────────────────────
# Preparar directorio de salida y nombre de fichero
# ──────────────────────────────────────────────
mkdir -p "$OUTPUT_DIR"

FECHA=$(date +%Y%m%d_%H%M%S)
SAFE_PAIS=$(echo "$PAIS"   | iconv -f UTF-8 -t ASCII//TRANSLIT 2>/dev/null | tr ' /' '__' || echo "$PAIS" | tr ' /áéíóúÁÉÍÓÚñÑüÜ' '__aeiouAEIOUnNuU')
SAFE_REGION=$(echo "$REGION" | iconv -f UTF-8 -t ASCII//TRANSLIT 2>/dev/null | tr ' /' '__' || echo "$REGION" | tr ' /áéíóúÁÉÍÓÚñÑüÜ' '__aeiouAEIOUnNuU')
SAFE_SECTOR=$(echo "$SECTOR" | iconv -f UTF-8 -t ASCII//TRANSLIT 2>/dev/null | tr ' /' '__' || echo "$SECTOR" | tr ' /áéíóúÁÉÍÓÚñÑüÜ' '__aeiouAEIOUnNuU')

OUTPUT_FILE="${OUTPUT_DIR}/${FECHA}_${SAFE_PAIS}_${SAFE_REGION}_${SAFE_SECTOR}_normativas.md"

# ──────────────────────────────────────────────
# Cabecera de inicio
# ──────────────────────────────────────────────
echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║       EQUIPO NORMATIVAS — Sistema Multi-Agente        ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
echo "  📍  País:    $PAIS"
echo "  🗺️   Región:  $REGION"
[[ -n "$CIUDAD" ]] && echo "  🏙️   Ciudad:  $CIUDAD"
echo "  🏗️   Sector:  $SECTOR"
echo "  📄  Salida:  $OUTPUT_FILE"
echo "  🕐  Inicio:  $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ──────────────────────────────────────────────
# Construir prompt para Claude Code
# ──────────────────────────────────────────────
CIUDAD_LINE=""
[[ -n "$CIUDAD" ]] && CIUDAD_LINE="- Ciudad/Municipio: ${CIUDAD}"

PROMPT=$(cat <<PROMPT_EOF
Lee el archivo normativas/SISTEMA.md y ejecuta el protocolo completo del Equipo Normativas para el siguiente proyecto:

## DATOS DE ENTRADA

- País: ${PAIS}
- Región/Comunidad Autónoma/Estado: ${REGION}
${CIUDAD_LINE}
- Sector de uso del edificio: ${SECTOR}
- Archivo de salida: ${OUTPUT_FILE}
- Fecha de análisis: $(date +%Y-%m-%d)

## INSTRUCCIONES DE EJECUCIÓN

Ejecuta los 4 pasos del sistema en orden estricto:

**PASO 1 — Agente GeoAnalista:**
Identifica todos los niveles jurisdiccionales aplicables (internacional, europeo, nacional, regional, local).
Determina los organismos normativos y sus sitios web oficiales.
Produce el bloque GEOANALISTA_OUTPUT antes de continuar.

**PASO 2 — Agente Buscador (en paralelo por nivel):**
Para CADA nivel jurisdiccional identificado, busca normativas en TODAS las categorías relevantes para el sector "${SECTOR}".
Accede a los sitios oficiales identificados. No te limites a resultados de buscador.
Produce el bloque BUSCADOR_OUTPUT con la lista completa de normativas encontradas.

**PASO 3 — Agente Validador:**
Valida TODOS los URLs de pdf encontrados en el Paso 2.
Usa WebFetch o el script normativas/validate_urls.py para verificar cada enlace.
Para URLs no válidos, busca alternativas en los sitios oficiales.
Produce el bloque VALIDADOR_OUTPUT con el estado de cada URL.

**PASO 4 — Agente Documentador:**
Genera el informe final siguiendo EXACTAMENTE la estructura definida en SISTEMA.md.
Incluye: metadata YAML, TOC, resumen ejecutivo, tablas por nivel jurisdiccional,
sección de normativas específicas del sector, y control de calidad completo.
Guarda el fichero en: ${OUTPUT_FILE}

## CRITERIO DE CALIDAD

El proceso NO está completo hasta que:
1. Todas las jurisdicciones están cubiertas
2. Todas las categorías del sector están representadas
3. Todos los URLs tienen indicador (✅ ⚠️ ❌)
4. El fichero está guardado en la ruta indicada

¡Comienza con el PASO 1 ahora!
PROMPT_EOF
)

# ──────────────────────────────────────────────
# Ejecutar con Claude Code
# ──────────────────────────────────────────────
echo "🚀  Iniciando equipo de agentes..."
echo "    (El proceso puede tardar varios minutos según la profundidad de búsqueda)"
echo ""

claude -p "$PROMPT"

# ──────────────────────────────────────────────
# Verificar resultado
# ──────────────────────────────────────────────
echo ""
if [[ -f "$OUTPUT_FILE" ]]; then
    LINEAS=$(wc -l < "$OUTPUT_FILE")
    TAMAÑO=$(du -h "$OUTPUT_FILE" | cut -f1)
    echo "╔═══════════════════════════════════════════════════════╗"
    echo "║                  PROCESO COMPLETADO                   ║"
    echo "╚═══════════════════════════════════════════════════════╝"
    echo ""
    echo "  ✅  Informe generado correctamente"
    echo "  📄  Archivo: $OUTPUT_FILE"
    echo "  📏  Tamaño: $TAMAÑO ($LINEAS líneas)"
    echo "  🕐  Fin: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
else
    echo "  ⚠️   El fichero de salida no se encontró en la ruta esperada."
    echo "      Busca el informe generado en: $OUTPUT_DIR"
    echo ""
fi
