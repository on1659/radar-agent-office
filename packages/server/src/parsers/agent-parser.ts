// Design Ref: §2.2 — .claude/agents/ parser
import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import type { Agent, Department, ModelType } from '@radar/shared';

const MODEL_KEYWORDS: Record<string, ModelType> = {
  opus: 'opus',
  sonnet: 'sonnet',
  haiku: 'haiku',
};

const DEPT_KEYWORDS: Record<string, Department> = {
  dev: 'dev', develop: 'dev', frontend: 'dev', backend: 'dev',
  review: 'review', qa: 'review', test: 'review',
  ops: 'ops', devops: 'ops', infra: 'ops',
  biz: 'biz', business: 'biz', product: 'biz',
  legal: 'legal', compliance: 'legal',
  invest: 'invest', research: 'invest',
};

function detectModel(content: string): ModelType {
  const lower = content.toLowerCase();
  for (const [keyword, model] of Object.entries(MODEL_KEYWORDS)) {
    if (lower.includes(keyword)) return model;
  }
  return 'sonnet';
}

function detectDepartment(name: string, content: string): Department {
  const lower = (name + ' ' + content).toLowerCase();
  for (const [keyword, dept] of Object.entries(DEPT_KEYWORDS)) {
    if (lower.includes(keyword)) return dept;
  }
  return 'dev';
}

export async function parseAgents(claudeDir: string): Promise<Agent[]> {
  const agentsDir = join(claudeDir, 'agents');
  const agents: Agent[] = [];

  try {
    const files = await readdir(agentsDir);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;

      const content = await readFile(join(agentsDir, file), 'utf-8');
      const name = basename(file, '.md');

      // Extract role from first heading or first line
      const roleMatch = content.match(/^#\s+(.+)/m);
      const role = roleMatch?.[1] ?? name;

      agents.push({
        id: name,
        name,
        department: detectDepartment(name, content),
        model: detectModel(content),
        role,
        status: 'idle',
      });
    }
  } catch {
    // agents/ directory may not exist
  }

  return agents;
}
