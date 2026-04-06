// Design Ref: §2.2 — .claude/ directory parsing orchestrator
import { join } from 'node:path';
import { access } from 'node:fs/promises';
import type { Agent, Skill, Hook, Rule, WorkspaceOverview } from '@radar/shared';
import { parseAgents } from '../parsers/agent-parser.js';
import { parseSkills } from '../parsers/skill-parser.js';
import { parseHooks } from '../parsers/hook-parser.js';
import { parseRules } from '../parsers/rule-parser.js';

export interface WorkspaceData {
  agents: Agent[];
  skills: Skill[];
  hooks: Hook[];
  rules: Rule[];
  overview: WorkspaceOverview;
}

// Cache with TTL
let cache: { data: WorkspaceData; timestamp: number } | null = null;
const CACHE_TTL = 10_000; // 10 seconds

export async function scanWorkspace(workspaceRoot: string): Promise<WorkspaceData> {
  // Return cached if fresh
  if (cache && Date.now() - cache.timestamp < CACHE_TTL) {
    return cache.data;
  }

  const claudeDir = join(workspaceRoot, '.claude');

  // Check if .claude/ exists
  try {
    await access(claudeDir);
  } catch {
    const empty: WorkspaceData = {
      agents: [], skills: [], hooks: [], rules: [],
      overview: {
        agents: 0, skills: 0, hooks: 0, rules: 0,
        pipelines: 0, mcpServers: 0, total: 0,
        activeJobs: 0, modelDistribution: {},
      },
    };
    cache = { data: empty, timestamp: Date.now() };
    return empty;
  }

  const [agents, skills, hooks, rules] = await Promise.all([
    parseAgents(claudeDir),
    parseSkills(claudeDir),
    parseHooks(claudeDir),
    parseRules(claudeDir, workspaceRoot),
  ]);

  // Model distribution
  const modelDistribution: Record<string, number> = {};
  for (const agent of agents) {
    modelDistribution[agent.model] = (modelDistribution[agent.model] ?? 0) + 1;
  }

  const data: WorkspaceData = {
    agents,
    skills,
    hooks,
    rules,
    overview: {
      agents: agents.length,
      skills: skills.length,
      hooks: hooks.length,
      rules: rules.length,
      pipelines: 0, // Phase 3
      mcpServers: 0, // Phase 3
      total: agents.length + skills.length + hooks.length + rules.length,
      activeJobs: 0, // Updated by agent-pool
      modelDistribution,
    },
  };

  cache = { data, timestamp: Date.now() };
  return data;
}

export function invalidateCache() {
  cache = null;
}
