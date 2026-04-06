// Design Ref: §2.1, §2.4 — AgentProcessPool (p-limit based concurrency)
import pLimit from 'p-limit';
import { config } from '../config.js';
import { runCli, stopCli, getActiveProcesses } from './cli-runner.js';
import { broadcast } from '../ws/handler.js';
import type { AgentResult } from '@radar/shared';

const limit = pLimit(config.maxConcurrent);
let queueSize = 0;

export function getActiveJobCount(): number {
  return getActiveProcesses().size;
}

export function getQueueSize(): number {
  return queueSize;
}

export async function enqueueAgent(
  agentId: string,
  sessionId: string,
  prompt: string,
  workspace?: string,
  model?: string,
  maxTurns?: number,
): Promise<AgentResult> {
  queueSize++;

  broadcast({ type: 'agentQueued', agentId, position: queueSize });
  broadcast({ type: 'statusUpdate', agentId, status: 'queued' });

  const result = await limit(async () => {
    queueSize--;
    broadcast({ type: 'statusUpdate', agentId, status: 'working' });
    return runCli(agentId, sessionId, prompt, workspace, model, maxTurns);
  });

  return result;
}

export function stopAgent(agentId: string): boolean {
  return stopCli(agentId);
}
