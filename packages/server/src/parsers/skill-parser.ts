// Design Ref: §2.2 — .claude/skills/ parser
import { readdir, readFile } from 'node:fs/promises';
import { join, basename } from 'node:path';
import type { Skill } from '@radar/shared';

export async function parseSkills(claudeDir: string): Promise<Skill[]> {
  const dirs = [join(claudeDir, 'skills'), join(claudeDir, 'commands')];
  const skills: Skill[] = [];

  for (const dir of dirs) {
    try {
      const files = await readdir(dir);
      for (const file of files) {
        if (!file.endsWith('.md')) continue;

        const filePath = join(dir, file);
        const content = await readFile(filePath, 'utf-8');
        const name = basename(file, '.md');

        // Extract description from first line or heading
        const descMatch = content.match(/^#\s+(.+)/m) ?? content.match(/^(.+)/m);
        const description = descMatch?.[1]?.slice(0, 100) ?? name;

        // Detect type from content
        const lower = content.toLowerCase();
        const type = lower.includes('workflow') ? 'workflow'
          : lower.includes('capability') ? 'capability'
          : 'hybrid';

        skills.push({ name, path: filePath, description, type });
      }
    } catch {
      // directory may not exist
    }
  }

  return skills;
}
