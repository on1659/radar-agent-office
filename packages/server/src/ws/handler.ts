// Design Ref: §4.3 — WebSocket connection management
import type { FastifyInstance } from 'fastify';
import type { WebSocket } from '@fastify/websocket';
import type { ServerEvent, ClientEvent } from '@radar/shared';
import { config } from '../config.js';
import { isClientEvent, serializeEvent } from './events.js';
import { triggerMeetingNow, stopScheduler, getSchedulerStatus } from '../services/scheduler.js';

const clients = new Set<WebSocket>();

export function broadcast(event: ServerEvent) {
  const msg = serializeEvent(event);
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) {
      ws.send(msg);
    }
  }
}

export async function registerWebSocket(app: FastifyInstance) {
  app.get('/ws', { websocket: true }, (socket, req) => {
    // Auth check via query param
    const url = new URL(req.url!, `http://${req.headers.host}`);
    const token = url.searchParams.get('token');

    if (token !== config.authToken) {
      socket.close(4001, 'Unauthorized');
      return;
    }

    clients.add(socket);

    // Heartbeat
    const heartbeat = setInterval(() => {
      if (socket.readyState === socket.OPEN) {
        socket.ping();
      }
    }, config.ws.heartbeatInterval);

    // Rate limiting
    let messageCount = 0;
    const rateLimitReset = setInterval(() => { messageCount = 0; }, 1000);

    socket.on('message', (raw: Buffer | ArrayBuffer | Buffer[]) => {
      messageCount++;
      if (messageCount > config.ws.rateLimit) return;

      try {
        const data = JSON.parse(raw.toString()) as ClientEvent;
        if (!isClientEvent(data)) return;

        app.log.info({ event: data.type }, 'ws:clientEvent');

        if (data.type === 'startMeeting') {
          triggerMeetingNow(data.agenda).catch((err: Error) => {
            app.log.error({ err }, 'Meeting trigger failed via WS');
          });
        } else if (data.type === 'stopMeeting') {
          stopScheduler();
          broadcast({ type: 'meetingUpdate', meeting: getSchedulerStatus() });
        }
      } catch {
        // ignore malformed messages
      }
    });

    socket.on('close', () => {
      clients.delete(socket);
      clearInterval(heartbeat);
      clearInterval(rateLimitReset);
    });
  });
}
