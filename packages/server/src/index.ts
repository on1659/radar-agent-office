import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { config, printStartupInfo } from './config.js';
import { getDb, closeDb } from './db/client.js';
import { registerWebSocket } from './ws/handler.js';
import { workspaceRoutes } from './routes/workspace.js';
import { agentRoutes } from './routes/agent.js';
import { sessionRoutes } from './routes/sessions.js';
import { meetingRoutes } from './routes/meetings.js';
import { startScheduler, stopScheduler } from './services/scheduler.js';
import { seedDefaultAgents } from './services/agent-registry.js';

const server = Fastify({
  logger: true,
  bodyLimit: config.rest.maxBodySize,
});

// --- Auth middleware (skip health + token endpoint) ---
server.addHook('onRequest', async (req, reply) => {
  if (req.url === '/api/health') return;
  if (req.url === '/api/auth/token') return; // localhost auto-auth
  if (req.url.startsWith('/ws')) return; // WS auth handled in handler.ts

  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token !== config.authToken) {
    return reply.code(401).send({ error: 'Unauthorized' });
  }
});

// --- Health ---
server.get('/api/health', async () => {
  return { status: 'ok', version: '0.1.0' };
});

// --- Auto-auth for localhost ---
server.get('/api/auth/token', async (req, reply) => {
  // Only allow from 127.0.0.1 (local connections)
  const ip = req.ip;
  if (ip !== '127.0.0.1' && ip !== '::1' && ip !== '::ffff:127.0.0.1') {
    return reply.code(403).send({ error: 'Local access only' });
  }
  return { token: config.authToken };
});

// --- Startup ---
async function start() {
  try {
    // Init DB + seed default agents
    getDb();
    seedDefaultAgents();

    // WebSocket
    await server.register(websocket);
    await registerWebSocket(server);

    // REST routes
    await server.register(workspaceRoutes);
    await server.register(agentRoutes);
    await server.register(sessionRoutes);
    await server.register(meetingRoutes);

    await server.listen({ port: config.port, host: config.host });
    printStartupInfo();

    // Start meeting scheduler if enabled
    if (config.meeting.autoStart) {
      startScheduler();
    }
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', () => {
  stopScheduler();
  closeDb();
  process.exit(0);
});

start();
