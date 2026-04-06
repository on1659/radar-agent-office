// Meeting REST API routes
import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/client.js';
import {
  triggerMeetingNow,
  getSchedulerStatus,
  startScheduler,
  stopScheduler,
  isSchedulerActive,
} from '../services/scheduler.js';
import { loadAgentMemory, updateFocus } from '../services/agent-memory.js';
import {
  listAgents, hireAgent, fireAgent, rehireAgent, updateAgent, getAgent,
} from '../services/agent-registry.js';
import type { MeetingAgentId, AgentRole } from '@radar/shared';

export async function meetingRoutes(fastify: FastifyInstance) {
  // Start a meeting manually
  fastify.post('/api/meetings/start', async (req, reply) => {
    const body = req.body as { agenda?: string[] } | null;
    // Fire and forget — meeting runs in background
    triggerMeetingNow(body?.agenda ?? undefined).catch((err) => {
      fastify.log.error(err, 'Meeting trigger failed');
    });
    return { status: 'meeting_started' };
  });

  // List meetings
  fastify.get('/api/meetings', async (req, reply) => {
    const db = getDb();
    const query = req.query as { limit?: string };
    const limit = Math.min(Number(query.limit) || 20, 100);
    const rows = db.prepare(
      'SELECT * FROM meetings ORDER BY started_at DESC LIMIT ?',
    ).all(limit);
    return rows.map(parseRow);
  });

  // Get latest meeting
  fastify.get('/api/meetings/latest', async () => {
    const db = getDb();
    const row = db.prepare(
      'SELECT * FROM meetings ORDER BY started_at DESC LIMIT 1',
    ).get();
    return row ? parseRow(row) : null;
  });

  // Get meeting detail with messages
  fastify.get<{ Params: { id: string } }>('/api/meetings/:id', async (req) => {
    const db = getDb();
    const meeting = db.prepare('SELECT * FROM meetings WHERE id = ?').get(req.params.id);
    if (!meeting) return { error: 'Not found' };

    const messages = db.prepare(
      'SELECT * FROM meeting_messages WHERE meeting_id = ? ORDER BY created_at',
    ).all(req.params.id);

    return { ...parseRow(meeting), messages };
  });

  // === Agent Memory ===

  // Get agent memory
  fastify.get<{ Params: { id: string } }>('/api/agents/:id/memory', async (req, reply) => {
    const agentId = req.params.id;
    if (!getAgent(agentId)) return reply.code(404).send({ error: 'Agent not found' });
    return loadAgentMemory(agentId);
  });

  // Update agent focus
  fastify.put<{ Params: { id: string } }>('/api/agents/:id/memory/focus', async (req, reply) => {
    const agentId = req.params.id;
    if (!getAgent(agentId)) return reply.code(404).send({ error: 'Agent not found' });
    const body = req.body as { focus: string } | null;
    if (!body?.focus) return reply.code(400).send({ error: 'Missing focus field' });
    updateFocus(agentId, body.focus);
    return { status: 'updated' };
  });

  // === Team Agent Management (Hire/Fire) ===

  // List all team agents
  fastify.get('/api/team', async (req) => {
    const query = req.query as { all?: string };
    return listAgents(query.all === 'true');
  });

  // Hire new agent
  fastify.post('/api/team/hire', async (req, reply) => {
    const body = req.body as {
      id?: string; name: string; role: AgentRole;
      model?: 'opus' | 'sonnet' | 'haiku'; isPd?: boolean; identity: string;
    } | null;
    if (!body?.name || !body?.identity) {
      return reply.code(400).send({ error: 'name and identity are required' });
    }
    try {
      const agent = hireAgent({
        id: body.id,
        name: body.name,
        role: body.role ?? 'custom',
        model: body.model,
        isPd: body.isPd,
        identity: body.identity,
      });
      return agent;
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : 'Hire failed' });
    }
  });

  // Fire agent
  fastify.post<{ Params: { id: string } }>('/api/team/:id/fire', async (req, reply) => {
    try {
      const ok = fireAgent(req.params.id);
      if (!ok) return reply.code(404).send({ error: 'Agent not found' });
      return { status: 'fired', agentId: req.params.id };
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : 'Fire failed' });
    }
  });

  // Rehire agent
  fastify.post<{ Params: { id: string } }>('/api/team/:id/rehire', async (req, reply) => {
    const ok = rehireAgent(req.params.id);
    if (!ok) return reply.code(404).send({ error: 'Agent not found or already active' });
    return { status: 'rehired', agentId: req.params.id };
  });

  // Update agent
  fastify.put<{ Params: { id: string } }>('/api/team/:id', async (req, reply) => {
    const body = req.body as Partial<{ name: string; role: AgentRole; model: string; isPd: boolean }> | null;
    if (!body) return reply.code(400).send({ error: 'Body required' });
    const updated = updateAgent(req.params.id, body as Parameters<typeof updateAgent>[1]);
    if (!updated) return reply.code(404).send({ error: 'Agent not found' });
    return updated;
  });

  // === Scheduler ===

  fastify.get('/api/scheduler/status', async () => {
    return getSchedulerStatus();
  });

  fastify.post('/api/scheduler/toggle', async () => {
    if (isSchedulerActive()) {
      stopScheduler();
      return { active: false };
    } else {
      startScheduler();
      return { active: true };
    }
  });
}

// Parse DB row JSON fields
function parseRow(row: unknown): Record<string, unknown> {
  const r = row as Record<string, unknown>;
  return {
    ...r,
    agenda: safeJsonParse(r.agenda as string),
    decisions: safeJsonParse(r.decisions as string),
    tasks: safeJsonParse(r.tasks as string),
    participants: safeJsonParse(r.participants as string),
  };
}

function safeJsonParse(str: string | null | undefined): unknown {
  if (!str) return [];
  try { return JSON.parse(str); } catch { return str; }
}
