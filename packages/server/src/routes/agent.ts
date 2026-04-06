// Design Ref: §4.1, §4.2 — POST /api/agent/run|stop (M2: real CLI execution)
import type { FastifyInstance } from 'fastify';
import { randomUUID } from 'node:crypto';
import { getDb } from '../db/client.js';
import { broadcast } from '../ws/handler.js';
import { enqueueAgent, stopAgent } from '../services/agent-pool.js';
import { scanWorkspace } from '../services/workspace-scanner.js';
import { config } from '../config.js';

export async function agentRoutes(app: FastifyInstance) {
  // POST /api/agent/run — start agent task
  app.post<{
    Body: { agentId: string; prompt: string; workspace?: string; projectTag?: string };
  }>('/api/agent/run', async (req, reply) => {
    const { agentId, prompt, workspace, projectTag } = req.body;

    if (!agentId || !prompt) {
      return reply.code(400).send({ error: 'agentId and prompt are required' });
    }

    // Check if agent is already running
    const db = getDb();
    const running = db.prepare(
      `SELECT id FROM sessions WHERE agent_id = ? AND status = 'running'`
    ).get(agentId);

    if (running) {
      return reply.code(409).send({ error: 'Agent is already running' });
    }

    const sessionId = `sess_${randomUUID().slice(0, 8)}`;

    db.prepare(`
      INSERT INTO sessions (id, agent_id, prompt, status, project_tag, workspace_path)
      VALUES (?, ?, ?, 'running', ?, ?)
    `).run(sessionId, agentId, prompt, projectTag ?? null, workspace ?? null);

    // Log activity
    db.prepare(`
      INSERT INTO activity_log (id, type, agent_id, session_id, description)
      VALUES (?, 'agent_started', ?, ?, ?)
    `).run(randomUUID(), agentId, sessionId, `Started: ${prompt.slice(0, 100)}`);

    // Detect agent model from workspace data
    const wsData = await scanWorkspace(config.workspaceRoot);
    const agentInfo = wsData.agents.find(a => a.id === agentId);
    const model = agentInfo?.model ?? 'sonnet';

    // Respond immediately, run CLI in background
    reply.code(202).send({
      sessionId,
      agentId,
      status: 'queued',
      position: 0,
    });

    // Fire-and-forget CLI execution via pool
    enqueueAgent(agentId, sessionId, prompt, workspace, model).catch((err) => {
      app.log.error({ err, agentId, sessionId }, 'Agent execution failed');
    });
  });

  // POST /api/agent/stop — stop agent task
  app.post<{
    Body: { agentId: string };
  }>('/api/agent/stop', async (req, reply) => {
    const { agentId } = req.body;

    if (!agentId) {
      return reply.code(400).send({ error: 'agentId is required' });
    }

    // Try to kill the process first
    const killed = stopAgent(agentId);

    const db = getDb();
    const session = db.prepare(
      `SELECT id FROM sessions WHERE agent_id = ? AND status = 'running'`
    ).get(agentId) as { id: string } | undefined;

    if (!session && !killed) {
      return reply.code(404).send({ error: 'No running session for this agent' });
    }

    if (session) {
      db.prepare(`
        UPDATE sessions SET status = 'stopped', completed_at = datetime('now')
        WHERE id = ?
      `).run(session.id);

      db.prepare(`
        INSERT INTO activity_log (id, type, agent_id, session_id, description)
        VALUES (?, 'agent_stopped', ?, ?, 'Stopped by user')
      `).run(randomUUID(), agentId, session.id);
    }

    broadcast({ type: 'statusUpdate', agentId, status: 'idle' });

    return { status: 'stopped', sessionId: session?.id };
  });
}
