// Design Ref: §4.1 — GET /api/sessions, /api/activity, /api/stats/costs
import type { FastifyInstance } from 'fastify';
import { getDb } from '../db/client.js';

export async function sessionRoutes(app: FastifyInstance) {
  // GET /api/sessions — session history with pagination
  app.get<{
    Querystring: { limit?: string; offset?: string; status?: string; projectTag?: string };
  }>('/api/sessions', async (req) => {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    const offset = Number(req.query.offset) || 0;
    const db = getDb();

    let sql = 'SELECT * FROM sessions';
    const params: unknown[] = [];
    const conditions: string[] = [];

    if (req.query.status) {
      conditions.push('status = ?');
      params.push(req.query.status);
    }
    if (req.query.projectTag) {
      conditions.push('project_tag = ?');
      params.push(req.query.projectTag);
    }

    if (conditions.length) sql += ' WHERE ' + conditions.join(' AND ');
    sql += ' ORDER BY started_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const rows = db.prepare(sql).all(...params);
    return { data: rows, limit, offset };
  });

  // GET /api/sessions/:id — session detail
  app.get<{ Params: { id: string } }>('/api/sessions/:id', async (req, reply) => {
    const db = getDb();
    const row = db.prepare('SELECT * FROM sessions WHERE id = ?').get(req.params.id);
    if (!row) return reply.code(404).send({ error: 'Session not found' });
    return row;
  });

  // GET /api/activity — activity timeline
  app.get<{
    Querystring: { limit?: string; offset?: string };
  }>('/api/activity', async (req) => {
    const limit = Math.min(Number(req.query.limit) || 50, 200);
    const offset = Number(req.query.offset) || 0;
    const db = getDb();
    const rows = db.prepare(
      'SELECT * FROM activity_log ORDER BY timestamp DESC LIMIT ? OFFSET ?'
    ).all(limit, offset);
    return { data: rows, limit, offset };
  });

  // GET /api/stats/costs — cost summary per agent
  app.get<{
    Querystring: { date?: string };
  }>('/api/stats/costs', async (req) => {
    const db = getDb();
    let sql = `
      SELECT agent_id as agentId,
             SUM(input_tokens) as totalInputTokens,
             SUM(output_tokens) as totalOutputTokens,
             SUM(cost_usd) as totalCostUsd,
             COUNT(*) as sessionCount
      FROM sessions WHERE status = 'completed'
    `;
    const params: unknown[] = [];

    if (req.query.date) {
      sql += ` AND DATE(started_at) = ?`;
      params.push(req.query.date);
    }

    sql += ' GROUP BY agent_id';
    const rows = db.prepare(sql).all(...params);
    return { data: rows };
  });
}
