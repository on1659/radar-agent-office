// Design Ref: §2.4 — Claude CLI subprocess management
import { spawn, type ChildProcess } from 'node:child_process';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { config } from '../config.js';
import { getDb } from '../db/client.js';
import { broadcast } from '../ws/handler.js';
import type { AgentResult } from '@radar/shared';

// Token pricing per million tokens (USD)
const TOKEN_PRICE: Record<string, { input: number; output: number }> = {
  'opus':   { input: 15.0, output: 75.0 },
  'sonnet': { input: 3.0,  output: 15.0 },
  'haiku':  { input: 0.25, output: 1.25 },
};

const activeProcesses = new Map<string, ChildProcess>();

export function getActiveProcesses() {
  return activeProcesses;
}

export async function runCli(
  agentId: string,
  sessionId: string,
  prompt: string,
  workspace?: string,
  model: string = 'sonnet',
  maxTurns: number = 50,
): Promise<AgentResult> {
  const args = [
    '--print',
    '--verbose',
    '--output-format', 'stream-json',
    '--max-turns', String(maxTurns),
    '--dangerously-skip-permissions',
  ];

  if (model) {
    args.push('--model', model);
  }

  // workspace is handled via spawn cwd option, not CLI flag

  // Pass prompt via stdin to avoid command-line length limits
  args.push('-');

  const proc = spawn(config.claudeCliPath, args, {
    cwd: resolve(workspace ?? process.cwd()),
    env: { ...process.env },
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  // Write prompt to stdin and close
  proc.stdin?.write(prompt);
  proc.stdin?.end();

  console.log(`[CLI] Spawned ${config.claudeCliPath} for agent=${agentId} model=${model} prompt_len=${prompt.length} args=[${args.slice(0, -1).join(' ')}]`);

  activeProcesses.set(agentId, proc);

  let fullOutput = '';
  let inputTokens = 0;
  let outputTokens = 0;
  const filesChanged: string[] = [];
  const startTime = Date.now();
  let stdoutBuffer = '';

  return new Promise<AgentResult>((res) => {
    // Handle spawn errors (command not found, permission denied, etc.)
    proc.on('error', (err) => {
      activeProcesses.delete(agentId);
      const result: AgentResult = {
        output: `Spawn error: ${err.message}`,
        filesChanged: [],
        tokensUsed: 0,
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        duration: Date.now() - startTime,
        exitCode: 1,
      };
      broadcast({ type: 'agentDone', agentId, result });
      broadcast({ type: 'statusUpdate', agentId, status: 'error' });
      res(result);
    });

    proc.stdout?.on('data', (chunk: Buffer) => {
      stdoutBuffer += chunk.toString();
      const lines = stdoutBuffer.split('\n');
      stdoutBuffer = lines.pop() ?? ''; // Keep incomplete last line in buffer

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const event = JSON.parse(line);

          // Stream content + track file changes in single loop
          if (event.type === 'assistant' && event.message?.content) {
            for (const block of event.message.content) {
              if (block.type === 'text') {
                fullOutput += block.text;
                broadcast({ type: 'agentStream', agentId, chunk: block.text });
              } else if (block.type === 'tool_use' && block.name === 'Write') {
                const path = block.input?.file_path;
                if (path && !filesChanged.includes(path)) {
                  filesChanged.push(path);
                }
              }
            }
          }

          // Track token usage + capture result text as fallback
          if (event.type === 'result') {
            if (event.usage) {
              inputTokens += event.usage.input_tokens ?? 0;
              outputTokens += event.usage.output_tokens ?? 0;
            }
            // If no text was captured from assistant events, use result.result
            if (!fullOutput && event.result) {
              fullOutput = event.result;
              broadcast({ type: 'agentStream', agentId, chunk: event.result });
            }
          }
        } catch {
          // Non-JSON output, stream as-is
          fullOutput += line;
          broadcast({ type: 'agentStream', agentId, chunk: line });
        }
      }
    });

    proc.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      console.error(`[CLI stderr][${agentId}] ${text.trim()}`);
      broadcast({ type: 'agentStream', agentId, chunk: `[stderr] ${text}` });
    });

    proc.on('close', (code) => {
      console.log(`[CLI] Agent=${agentId} exited code=${code} output_len=${fullOutput.length} tokens=${inputTokens}+${outputTokens}`);
      activeProcesses.delete(agentId);

      // Flush remaining buffer
      if (stdoutBuffer.trim()) {
        fullOutput += stdoutBuffer;
        broadcast({ type: 'agentStream', agentId, chunk: stdoutBuffer });
      }

      const duration = Date.now() - startTime;
      const tokensUsed = inputTokens + outputTokens;
      const pricing = TOKEN_PRICE[model] ?? TOKEN_PRICE.sonnet;
      const costUsd = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000;

      const result: AgentResult = {
        output: fullOutput,
        filesChanged,
        tokensUsed,
        inputTokens,
        outputTokens,
        costUsd,
        duration,
        exitCode: code ?? 1,
      };

      // Persist to DB (wrapped in try-catch to guarantee resolve)
      try {
        const db = getDb();
        db.prepare(`
          UPDATE sessions
          SET status = ?, result = ?, tokens_used = ?, input_tokens = ?,
              output_tokens = ?, cost_usd = ?, completed_at = datetime('now')
          WHERE id = ?
        `).run(
          code === 0 ? 'completed' : 'error',
          fullOutput.slice(0, 10_000),
          tokensUsed,
          inputTokens,
          outputTokens,
          costUsd,
          sessionId,
        );

        db.prepare(`
          INSERT INTO activity_log (id, type, agent_id, session_id, description)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          randomUUID(),
          code === 0 ? 'agent_done' : 'agent_error',
          agentId,
          sessionId,
          code === 0 ? `Completed (${tokensUsed} tokens, $${costUsd.toFixed(4)})` : `Error (exit ${code})`,
        );
      } catch { /* DB write failure should not block result delivery */ }

      broadcast({ type: 'agentDone', agentId, result });
      broadcast({ type: 'statusUpdate', agentId, status: 'idle' });

      res(result);
    });
  });
}

export function stopCli(agentId: string): boolean {
  const proc = activeProcesses.get(agentId);
  if (!proc) return false;
  proc.kill('SIGTERM');
  activeProcesses.delete(agentId);
  return true;
}
