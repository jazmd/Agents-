import express from 'express';
import http from 'http';
import { WebSocketServer } from 'ws';
import cors from 'cors';
import { fileURLToPath } from 'url';
import path from 'path';
import { router as apiRouter } from './routes/api.js';
import { handleConnection } from './services/websocket.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3001;

const app = express();
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

app.use('/api', apiRouter);

const distPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(distPath));
app.get('*', (_req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

wss.on('connection', handleConnection);
wss.on('error', (err) => {
  console.error('WebSocket server error:', err.message);
});

server.on('error', (err) => {
  console.error('Server error:', err.message);
});

process.on('uncaughtException', (err) => {
  if (err.code === 'ECONNABORTED' || err.code === 'ECONNRESET' || err.code === 'EPIPE') {
    console.warn('Connection closed by client:', err.code);
    return;
  }
  console.error('Uncaught exception:', err);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`Normativas API running on port ${PORT}`);
});
