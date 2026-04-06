// Design Ref: §2.2 — .claude/hooks.json parser
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { Hook } from '@radar/shared';

interface HooksConfig {
  hooks?: Record<string, Array<{ type?: string; command: string }>>;
}

export async function parseHooks(claudeDir: string): Promise<Hook[]> {
  const hooks: Hook[] = [];

  // Try settings.json (CC standard) and hooks.json
  for (const filename of ['settings.json', 'hooks.json']) {
    try {
      const raw = await readFile(join(claudeDir, filename), 'utf-8');
      const config: HooksConfig = JSON.parse(raw);

      if (config.hooks) {
        for (const [event, entries] of Object.entries(config.hooks)) {
          for (const entry of entries) {
            hooks.push({
              event,
              command: entry.command,
              type: entry.type === 'http' ? 'http' : 'shell',
            });
          }
        }
      }
    } catch {
      // file may not exist
    }
  }

  return hooks;
}
