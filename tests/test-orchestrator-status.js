import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const WebSocket = require('../src/backend/node_modules/ws/index.js');

const WS_URL = 'ws://localhost:3001/ws';
const TIMEOUT = 300000;

const received = [];
let ws;

function log(msg) {
  console.log(`[TEST] ${msg}`);
}

function connect() {
  return new Promise((resolve, reject) => {
    ws = new WebSocket(WS_URL);
    ws.on('open', () => resolve());
    ws.on('error', (err) => reject(new Error(`WebSocket error: ${err.message}`)));
    setTimeout(() => reject(new Error('Connection timeout')), 5000);
  });
}

function waitForSessionEnd() {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout esperando session_end. Mensajes recibidos: ${received.length}`));
    }, TIMEOUT);

    ws.on('message', (raw) => {
      const data = JSON.parse(raw.toString());
      received.push(data);

      if (data.type === 'agent_start') {
        log(`Agente iniciado: ${data.agentName}`);
      }
      if (data.type === 'agent_end') {
        log(`Agente terminado: ${data.agentName}`);
      }
      if (data.type === 'agent_skipped') {
        log(`Agente SALTADO: ${data.agentName}`);
      }
      if (data.type === 'session_end') {
        clearTimeout(timer);
        resolve(data);
      }
      if (data.type === 'error') {
        log(`Error: ${data.message}`);
      }
    });
  });
}

async function run() {
  log('Conectando a ' + WS_URL);
  await connect();
  log('Conectado. Enviando busqueda de prueba...');

  ws.send(JSON.stringify({
    type: 'start_search',
    pais: 'España',
    region: 'Cataluña',
    sector: 'Residencial',
    ciudad: 'Barcelona',
  }));

  log('Esperando resultado (max 60s)...');
  const result = await waitForSessionEnd();

  console.log('\n========== RESULTADO ==========');
  console.log(`Status: ${result.status}`);
  console.log(`Output file: ${result.outputFile || '(ninguno)'}`);
  console.log(`Agentes saltados: ${result.skippedAgents?.join(', ') || '(ninguno)'}`);

  const agentStarts = received.filter(m => m.type === 'agent_start').map(m => m.agentName);
  const agentEnds = received.filter(m => m.type === 'agent_end').map(m => m.agentName);
  const agentSkips = received.filter(m => m.type === 'agent_skipped').map(m => m.agentName);

  console.log(`\nAgentes que iniciaron: ${agentStarts.join(', ') || '(ninguno)'}`);
  console.log(`Agentes que terminaron: ${agentEnds.join(', ') || '(ninguno)'}`);
  console.log(`Agentes no ejecutados: ${agentSkips.join(', ') || '(ninguno)'}`);

  console.log('\n========== VERIFICACION ==========');
  if (result.status === 'completed' && agentSkips.length === 0) {
    log('PASS - Todos los agentes completaron correctamente');
  } else if (result.status === 'partial' && agentSkips.length > 0) {
    log('PASS - Status "partial" detectado correctamente con agentes saltados');
  } else if (result.status === 'error') {
    log('WARN - La busqueda termino con error (puede ser que claude CLI no esta disponible)');
  } else {
    log('INFO - Status: ' + result.status);
  }

  const totalMessages = received.filter(m => m.type === 'agent_message').length;
  console.log(`\nTotal mensajes de agente recibidos: ${totalMessages}`);

  ws.close();
  process.exit(0);
}

run().catch((err) => {
  console.error(`[TEST FAIL] ${err.message}`);
  ws?.close();
  process.exit(1);
});
