import { randomUUID } from 'node:crypto';
import { resolve, join, dirname } from 'node:path';
import { existsSync } from 'node:fs';

/** Walk up from CWD to find the monorepo root (contains turbo.json). */
function findMonorepoRoot(): string {
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    if (existsSync(join(dir, 'turbo.json'))) return dir;
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return process.cwd();
}

const monorepoRoot = findMonorepoRoot();

export const config = {
  port: Number(process.env.PORT) || 3001,
  host: '127.0.0.1',
  authToken: process.env.AUTH_TOKEN || randomUUID(),
  claudeCliPath: process.env.CLAUDE_CLI_PATH || 'claude',
  maxConcurrent: Number(process.env.MAX_CONCURRENT) || 4,
  workspaceRoot: process.env.WORKSPACE_ROOT ? resolve(process.env.WORKSPACE_ROOT) : monorepoRoot,
  monorepoRoot,
  ws: {
    heartbeatInterval: 30_000,
    maxMessageSize: 64 * 1024,
    rateLimit: 10, // per second
  },
  rest: {
    rateLimit: 60, // per minute
    maxBodySize: 1024 * 1024,
  },
  meeting: {
    intervalHours: Number(process.env.MEETING_INTERVAL_HOURS) || 5,
    autoStart: process.env.MEETING_AUTO_START !== 'false',
    agentMemoryDir: resolve(process.env.AGENT_MEMORY_DIR || join(monorepoRoot, 'data', 'agents')),
    maxJournalEntries: Number(process.env.MEETING_MAX_JOURNAL_ENTRIES) || 20,
    maxRecentMeetings: 3,
  },
} as const;

// Print token on startup so user can authenticate
export function printStartupInfo() {
  console.log(`\n  Radar Agent Office v0.1.0`);
  console.log(`  Server: http://${config.host}:${config.port}`);
  console.log(`  Auth Token: ${config.authToken}\n`);
}
