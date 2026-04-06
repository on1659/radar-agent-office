// Design Ref: §2.2 — .claude/ rules parser (CLAUDE.md + rules files)
import { readFile, readdir } from 'node:fs/promises';
import { join, basename } from 'node:path';
import type { Rule } from '@radar/shared';

export async function parseRules(claudeDir: string, workspaceRoot: string): Promise<Rule[]> {
  const rules: Rule[] = [];

  // 1. CLAUDE.md at workspace root
  try {
    const content = await readFile(join(workspaceRoot, 'CLAUDE.md'), 'utf-8');
    rules.push({
      content: content.slice(0, 500),
      source: 'CLAUDE.md',
      priority: 'important',
    });
  } catch {
    // no CLAUDE.md
  }

  // 2. .claude/rules/ directory
  try {
    const rulesDir = join(claudeDir, 'rules');
    const files = await readdir(rulesDir);
    for (const file of files) {
      if (!file.endsWith('.md')) continue;
      const content = await readFile(join(rulesDir, file), 'utf-8');
      rules.push({
        content: content.slice(0, 500),
        source: `rules/${basename(file)}`,
        priority: 'normal',
      });
    }
  } catch {
    // rules/ may not exist
  }

  return rules;
}
