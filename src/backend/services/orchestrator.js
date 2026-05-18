import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..', '..');

const sessions = new Map();
const childProcesses = new Map();

const AGENTS = [
  { id: 'coordinator', name: 'Coordinador', icon: '🎯', order: 1 },
  { id: 'geoanalyst', name: 'GeoAnalista', icon: '🌍', order: 2 },
  { id: 'searcher', name: 'Buscador', icon: '🔍', order: 3 },
  { id: 'validator', name: 'Validador', icon: '✅', order: 4 },
  { id: 'documenter', name: 'Documentador', icon: '📄', order: 5 },
];

export function getActiveSessions() {
  const list = [];
  for (const [id, s] of sessions) {
    list.push({ id, status: s.status, params: s.params, startedAt: s.startedAt });
  }
  return list;
}

export function getSessionResult(id) {
  return sessions.get(id) || null;
}

export function cancelSession(id) {
  const child = childProcesses.get(id);
  if (child && !child.killed) {
    child.kill('SIGTERM');
    childProcesses.delete(id);
  }
  const session = sessions.get(id);
  if (session && session.status === 'running') {
    session.status = 'cancelled';
  }
}

export function startSearch(sessionId, params, sendMessage) {
  const { pais, region, sector, ciudad, carpetaDescarga } = params;

  const outputDir = carpetaDescarga || path.join(PROJECT_ROOT, 'normativas', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const session = {
    status: 'running',
    params,
    startedAt: new Date().toISOString(),
    agents: AGENTS.map(a => ({ ...a, status: 'pending' })),
    messages: [],
    outputFile: null,
  };
  sessions.set(sessionId, session);

  sendMessage({ type: 'session_start', sessionId, agents: session.agents });

  runAgentPipeline(sessionId, session, params, outputDir, sendMessage);
}

async function runAgentPipeline(sessionId, session, params, outputDir, send) {
  const { pais, region, sector, ciudad } = params;

  const sistemaPath = path.join(PROJECT_ROOT, 'normativas', 'SISTEMA.md');
  let sistemaContent = '';
  try {
    sistemaContent = fs.readFileSync(sistemaPath, 'utf-8');
  } catch {
    send({ type: 'error', message: 'No se encontró SISTEMA.md' });
    session.status = 'error';
    return;
  }

  const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const sanitize = (s) => s.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_]/g, '');
  const outputFile = path.join(
    outputDir,
    `${timestamp}_${sanitize(pais)}_${sanitize(region)}_${sanitize(sector)}_normativas.md`
  );
  session.outputFile = outputFile;

  const ciudadLine = ciudad ? `Ciudad/Municipio: ${ciudad}` : '';
  const prompt = `Eres el sistema "Equipo Normativas". Lee y sigue EXACTAMENTE este protocolo:

--- INICIO PROTOCOLO ---
${sistemaContent}
--- FIN PROTOCOLO ---

Parámetros del proyecto:
- País: ${pais}
- Región/Comunidad: ${region}
- Sector: ${sector}
${ciudadLine}

IMPORTANTE:
1. Ejecuta los 4 PASOS del protocolo en orden.
2. Antes de cada paso, imprime: ">>> AGENTE: [nombre_agente] - INICIO"
3. Después de cada paso, imprime: ">>> AGENTE: [nombre_agente] - FIN"
4. Si necesitas información del usuario, imprime: ">>> PREGUNTA: [tu pregunta]"
5. Muestra progreso detallado durante la búsqueda.
6. Guarda el informe final en: ${outputFile}

Comienza ahora.`;

  const promptFile = path.join(os.tmpdir(), `normativas-prompt-${sessionId}.txt`);
  fs.writeFileSync(promptFile, prompt, 'utf-8');

  const claudeCmd = process.env.CLAUDE_CMD || 'claude';
  let child;
  try {
    child = spawn(claudeCmd, ['-p', '--verbose', '--output-format', 'stream-json'], {
      cwd: PROJECT_ROOT,
      env: { ...process.env },
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    child.stdin.write(prompt);
    child.stdin.end();
  } catch (err) {
    session.status = 'error';
    try { fs.unlinkSync(promptFile); } catch {}
    send({ type: 'error', message: `No se pudo iniciar claude: ${err.message}` });
    send({ type: 'session_end', sessionId, status: 'error', outputFile: null });
    return;
  }

  childProcesses.set(sessionId, child);
  let buffer = '';

  child.on('error', (err) => {
    session.status = 'error';
    childProcesses.delete(sessionId);
    send({ type: 'error', message: `Error del proceso: ${err.message}` });
    send({ type: 'session_end', sessionId, status: 'error', outputFile: null });
  });

  child.stdout.on('data', (chunk) => {
    if (session.status === 'cancelled') return;

    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();

    for (const line of lines) {
      if (!line.trim()) continue;

      let parsed;
      try {
        parsed = JSON.parse(line);
      } catch {
        processTextLine(line, sessionId, session, send);
        continue;
      }

      if (parsed.type === 'assistant' && parsed.message?.content) {
        for (const block of parsed.message.content) {
          if (block.type === 'text') {
            for (const textLine of block.text.split('\n')) {
              processTextLine(textLine, sessionId, session, send);
            }
          }
        }
      } else if (parsed.type === 'result' && parsed.result) {
        processTextLine(parsed.result, sessionId, session, send);
      }
    }
  });

  child.stderr.on('data', (chunk) => {
    if (session.status === 'cancelled') return;
    const text = chunk.toString().trim();
    if (text) {
      send({ type: 'agent_log', level: 'debug', message: text });
    }
  });

  child.on('close', (code) => {
    childProcesses.delete(sessionId);
    try { fs.unlinkSync(promptFile); } catch {}
    if (session.status === 'cancelled') return;

    const pendingAgents = session.agents.filter(a => a.status === 'pending');
    const runningAgents = session.agents.filter(a => a.status === 'running');

    for (const a of runningAgents) {
      a.status = code === 0 ? 'completed' : 'error';
    }
    for (const a of pendingAgents) {
      a.status = 'skipped';
      send({ type: 'agent_skipped', agentId: a.id, agentName: a.name, icon: a.icon });
    }

    const allCompleted = session.agents.every(a => a.status === 'completed');
    const fileExists = fs.existsSync(outputFile);

    if (code !== 0) {
      session.status = 'error';
    } else if (!allCompleted || !fileExists) {
      session.status = 'partial';
    } else {
      session.status = 'completed';
    }

    send({
      type: 'session_end',
      sessionId,
      status: session.status,
      outputFile: fileExists ? outputFile : null,
      skippedAgents: pendingAgents.map(a => a.name),
    });
  });
}

function processTextLine(line, sessionId, session, send) {
  const agentStart = line.match(/>>>\s*AGENTE:\s*(\w+)\s*-\s*INICIO/i);
  if (agentStart) {
    const agentId = mapAgentName(agentStart[1]);
    const agent = session.agents.find(a => a.id === agentId);
    if (agent) {
      agent.status = 'running';
      send({ type: 'agent_start', agentId, agentName: agent.name, icon: agent.icon });
    }
    return;
  }

  const agentEnd = line.match(/>>>\s*AGENTE:\s*(\w+)\s*-\s*FIN/i);
  if (agentEnd) {
    const agentId = mapAgentName(agentEnd[1]);
    const agent = session.agents.find(a => a.id === agentId);
    if (agent) {
      agent.status = 'completed';
      send({ type: 'agent_end', agentId, agentName: agent.name, icon: agent.icon });
    }
    return;
  }

  const question = line.match(/>>>\s*PREGUNTA:\s*(.+)/i);
  if (question) {
    send({ type: 'agent_question', question: question[1].trim(), sessionId });
    return;
  }

  if (line.trim()) {
    session.messages.push(line.trim());
    send({ type: 'agent_message', message: line.trim() });
  }
}

function mapAgentName(raw) {
  const lower = raw.toLowerCase();
  if (lower.includes('coord')) return 'coordinator';
  if (lower.includes('geo')) return 'geoanalyst';
  if (lower.includes('busc') || lower.includes('search')) return 'searcher';
  if (lower.includes('valid')) return 'validator';
  if (lower.includes('doc')) return 'documenter';
  return lower;
}
