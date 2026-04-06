// Agent Registry — manage team agents (hire/fire/list)
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync, existsSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { getDb } from '../db/client.js';
import { config } from '../config.js';
import type { TeamAgent, AgentRole } from '@radar/shared';

export interface HireOptions {
  id?: string;
  name: string;
  role: AgentRole;
  model?: 'opus' | 'sonnet' | 'haiku';
  isPd?: boolean;
  identity: string;  // personality/style markdown
}

/** Seed default 4 agents if table is empty */
export function seedDefaultAgents(): void {
  const db = getDb();
  const count = (db.prepare('SELECT COUNT(*) as c FROM team_agents').get() as { c: number }).c;
  if (count > 0) return;

  const defaults: Array<{ id: string; name: string; role: AgentRole; model: string; isPd: boolean }> = [
    { id: 'pd', name: '민준', role: 'pd', model: 'opus', isPd: true },
    { id: 'developer', name: '서진', role: 'developer', model: 'sonnet', isPd: false },
    { id: 'planner', name: '하은', role: 'planner', model: 'sonnet', isPd: false },
    { id: 'ui-designer', name: '도윤', role: 'designer', model: 'sonnet', isPd: false },
  ];

  const stmt = db.prepare(`
    INSERT OR IGNORE INTO team_agents (id, name, role, model, active, is_pd)
    VALUES (?, ?, ?, ?, 1, ?)
  `);

  for (const a of defaults) {
    stmt.run(a.id, a.name, a.role, a.model, a.isPd ? 1 : 0);
  }
}

/** List all agents (active only by default) */
export function listAgents(includeInactive = false): TeamAgent[] {
  const db = getDb();
  const query = includeInactive
    ? 'SELECT * FROM team_agents ORDER BY is_pd DESC, created_at'
    : 'SELECT * FROM team_agents WHERE active = 1 ORDER BY is_pd DESC, created_at';
  const rows = db.prepare(query).all() as Array<Record<string, unknown>>;
  return rows.map(toTeamAgent);
}

/** Get active agent IDs for meetings */
export function getActiveAgentIds(): string[] {
  return listAgents().map((a) => a.id);
}

/** Get the PD agent */
export function getPdAgent(): TeamAgent | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM team_agents WHERE is_pd = 1 AND active = 1 LIMIT 1').get();
  return row ? toTeamAgent(row as Record<string, unknown>) : null;
}

/** Get non-PD active agents (discussion order) */
export function getDiscussionAgents(): TeamAgent[] {
  return listAgents().filter((a) => !a.isPd);
}

/** Hire a new agent */
export function hireAgent(opts: HireOptions): TeamAgent {
  const db = getDb();
  const id = opts.id ?? opts.name.toLowerCase().replace(/[^a-z0-9]/g, '-');
  const model = opts.model ?? 'sonnet';

  // If isPd, demote existing PD
  if (opts.isPd) {
    db.prepare('UPDATE team_agents SET is_pd = 0').run();
  }

  db.prepare(`
    INSERT INTO team_agents (id, name, role, model, active, is_pd)
    VALUES (?, ?, ?, ?, 1, ?)
  `).run(id, opts.name, opts.role, model, opts.isPd ? 1 : 0);

  // Create memory directory + identity file
  const dir = join(config.meeting.agentMemoryDir, id);
  mkdirSync(join(dir, 'meetings'), { recursive: true });
  writeFileSync(join(dir, 'identity.md'), opts.identity, 'utf-8');
  writeFileSync(join(dir, 'journal.md'), `# ${opts.name}의 저널\n\n<!-- 회의/작업 후 자동으로 엔트리가 추가됩니다 -->\n`, 'utf-8');
  writeFileSync(join(dir, 'current-focus.md'), `# 현재 집중 사항\n\n신규 합류. 첫 회의에서 역할과 태스크를 배정받을 예정.\n`, 'utf-8');

  return getAgent(id)!;
}

/** Fire (deactivate) an agent */
export function fireAgent(agentId: string): boolean {
  const db = getDb();
  const agent = getAgent(agentId);
  if (!agent) return false;

  // Prevent firing the only PD
  if (agent.isPd) {
    const otherPds = listAgents().filter((a) => a.isPd && a.id !== agentId);
    if (otherPds.length === 0) {
      throw new Error('Cannot fire the only PD. Promote another agent to PD first.');
    }
  }

  db.prepare('UPDATE team_agents SET active = 0 WHERE id = ?').run(agentId);
  return true;
}

/** Rehire a previously fired agent */
export function rehireAgent(agentId: string): boolean {
  const db = getDb();
  const result = db.prepare('UPDATE team_agents SET active = 1 WHERE id = ? AND active = 0').run(agentId);
  return result.changes > 0;
}

/** Update agent (name, role, model, isPd) */
export function updateAgent(agentId: string, updates: Partial<Pick<TeamAgent, 'name' | 'role' | 'model' | 'isPd'>>): TeamAgent | null {
  const db = getDb();
  const agent = getAgent(agentId);
  if (!agent) return null;

  if (updates.isPd) {
    db.prepare('UPDATE team_agents SET is_pd = 0').run();
  }

  const fields: string[] = [];
  const values: unknown[] = [];
  if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
  if (updates.role !== undefined) { fields.push('role = ?'); values.push(updates.role); }
  if (updates.model !== undefined) { fields.push('model = ?'); values.push(updates.model); }
  if (updates.isPd !== undefined) { fields.push('is_pd = ?'); values.push(updates.isPd ? 1 : 0); }

  if (fields.length > 0) {
    values.push(agentId);
    db.prepare(`UPDATE team_agents SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  }

  return getAgent(agentId);
}

/** Get single agent */
export function getAgent(agentId: string): TeamAgent | null {
  const db = getDb();
  const row = db.prepare('SELECT * FROM team_agents WHERE id = ?').get(agentId);
  return row ? toTeamAgent(row as Record<string, unknown>) : null;
}

function toTeamAgent(row: Record<string, unknown>): TeamAgent {
  return {
    id: row.id as string,
    name: row.name as string,
    role: row.role as TeamAgent['role'],
    model: row.model as TeamAgent['model'],
    active: row.active === 1,
    isPd: row.is_pd === 1,
    createdAt: row.created_at as string,
  };
}
