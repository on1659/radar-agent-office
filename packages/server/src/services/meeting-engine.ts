// Meeting Engine — orchestrates the full meeting lifecycle (6 phases)
import { randomUUID } from 'node:crypto';
import { execSync } from 'node:child_process';
import { getDb } from '../db/client.js';
import { config } from '../config.js';
import { broadcast } from '../ws/handler.js';
import { enqueueAgent } from './agent-pool.js';
import {
  loadAgentMemory,
  loadAllAgentMemories,
  appendJournal,
  updateFocus,
  saveMeetingNotes,
} from './agent-memory.js';
import {
  buildOpeningPrompt,
  buildDiscussionPrompt,
  buildDecisionPrompt,
  buildExecutionPrompt,
  buildJournalPrompt,
} from './prompt-builder.js';
import {
  getActiveAgentIds, getPdAgent, getDiscussionAgents, getAgent,
} from './agent-registry.js';
import type {
  Meeting, MeetingAgentId, MeetingTask, MeetingPhase, MeetingStatus, AgentMemory,
} from '@radar/shared';

let currentMeeting: Meeting | null = null;

export function getCurrentMeeting(): Meeting | null {
  return currentMeeting;
}

export function getMeetingStatus(nextMeetingAt: string | null): MeetingStatus {
  const db = getDb();
  const row = db.prepare('SELECT COUNT(*) as count FROM meetings').get() as { count: number };
  return {
    currentMeeting,
    nextMeetingAt,
    totalMeetings: row.count,
    schedulerActive: true,
  };
}

/** Run a full meeting cycle */
export async function runMeeting(userAgenda?: string[]): Promise<Meeting> {
  if (currentMeeting) {
    throw new Error('A meeting is already in progress');
  }

  const db = getDb();
  const seqRow = db.prepare('SELECT COALESCE(MAX(sequence), 0) + 1 as seq FROM meetings').get() as { seq: number };
  const meetingId = randomUUID();
  const sequence = seqRow.seq;

  const activeIds = getActiveAgentIds();
  if (activeIds.length < 2) throw new Error('Need at least 2 active agents for a meeting');

  currentMeeting = {
    id: meetingId,
    sequence,
    status: 'context-loading',
    agenda: userAgenda ?? [],
    decisions: [],
    tasks: [],
    participants: activeIds,
    totalTokens: 0,
    totalCostUsd: 0,
    startedAt: new Date().toISOString(),
  };

  // Persist meeting record
  db.prepare(`
    INSERT INTO meetings (id, sequence, status, participants, started_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(meetingId, sequence, 'context-loading', JSON.stringify(currentMeeting.participants), currentMeeting.startedAt);

  broadcastStatus('context-loading');

  try {
    // Phase 1: Context Loading
    const memories = loadAllAgentMemories();
    const projectStatus = getProjectStatus();
    updatePhase(meetingId, 'opening');

    // Phase 2: PD Opening
    const pd = getPdAgent();
    if (!pd) throw new Error('No PD agent found');
    const pdMemory = memories.get(pd.id)!;
    const openingPrompt = buildOpeningPrompt(pdMemory, projectStatus);
    const openingResult = await runAgentTurn(pd.id, meetingId, 'opening', openingPrompt);
    const agenda = extractJson<{ agenda: string[] }>(openingResult.output)?.agenda ?? [];
    if (agenda.length > 0) currentMeeting.agenda = agenda;

    let conversation = `### ${pd.name} (${pd.id}, Opening)\n${openingResult.output}\n`;

    // Phase 3: Discussion — all non-PD agents
    updatePhase(meetingId, 'discussion');
    const discussionAgents = getDiscussionAgents();
    for (const agent of discussionAgents) {
      const agentMemory = memories.get(agent.id);
      if (!agentMemory) continue;
      const prompt = buildDiscussionPrompt(agentMemory, conversation);
      const result = await runAgentTurn(agent.id, meetingId, 'discussion', prompt);
      conversation += `\n### ${agent.name} (${agent.id})\n${result.output}\n`;
    }

    // Phase 4: PD Decision
    updatePhase(meetingId, 'decision');
    const decisionPrompt = buildDecisionPrompt(pdMemory, conversation);
    const decisionResult = await runAgentTurn(pd.id, meetingId, 'decision', decisionPrompt);
    const parsed = extractJson<{
      decisions: string[];
      tasks: MeetingTask[];
    }>(decisionResult.output);

    if (parsed) {
      currentMeeting.decisions = parsed.decisions ?? [];
      currentMeeting.tasks = (parsed.tasks ?? []).map((t) => ({ ...t, status: 'pending' as const }));
    }

    conversation += `\n### PD 민준 (Decision)\n${decisionResult.output}\n`;

    // Phase 5: Execution — run assigned tasks in parallel
    updatePhase(meetingId, 'execution');
    const taskResults = await executeTasksParallel(meetingId, memories);

    // Phase 6: Memory Update
    updatePhase(meetingId, 'memory-update');
    for (const agentId of currentMeeting.participants) {
      const agentTasks = currentMeeting.tasks.filter((t) => t.assignee === agentId);
      const taskSummary = taskResults.get(agentId) ?? 'No task assigned';
      const journalEntry = buildJournalPrompt(agentId, sequence, currentMeeting.decisions, taskSummary);
      appendJournal(agentId, journalEntry);
      saveMeetingNotes(agentId, sequence, conversation);

      // Update focus based on what was decided
      if (agentTasks.length > 0) {
        const focusContent = [
          '# 현재 집중 사항\n',
          `## 스프린트 목표 (Meeting #${sequence} 이후)`,
          ...agentTasks.map((t) => `- ${t.task}: ${t.description}`),
        ].join('\n');
        updateFocus(agentId, focusContent);
      }
    }

    // Complete
    currentMeeting.status = 'completed';
    currentMeeting.completedAt = new Date().toISOString();
    db.prepare(`
      UPDATE meetings
      SET status = 'completed', agenda = ?, decisions = ?, tasks = ?,
          total_tokens = ?, total_cost_usd = ?, completed_at = ?
      WHERE id = ?
    `).run(
      JSON.stringify(currentMeeting.agenda),
      JSON.stringify(currentMeeting.decisions),
      JSON.stringify(currentMeeting.tasks),
      currentMeeting.totalTokens,
      currentMeeting.totalCostUsd,
      currentMeeting.completedAt,
      meetingId,
    );

    broadcastStatus('completed');

    // Auto commit + push after meeting
    gitCommitAndPush(sequence, currentMeeting.totalTokens, currentMeeting.totalCostUsd);

    const completedMeeting = { ...currentMeeting };
    currentMeeting = null;
    return completedMeeting;
  } catch (err) {
    // Mark as failed
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (currentMeeting) {
      currentMeeting.status = 'failed';
      db.prepare('UPDATE meetings SET status = ? WHERE id = ?').run('failed', meetingId);
    }
    broadcastStatus('failed');
    currentMeeting = null;
    throw new Error(`Meeting failed: ${errorMsg}`);
  }
}

// --- Internal ---

async function runAgentTurn(
  agentId: MeetingAgentId,
  meetingId: string,
  phase: MeetingPhase,
  prompt: string,
): Promise<{ output: string; tokens: number; cost: number }> {
  const sessionId = randomUUID();
  const db = getDb();

  // Create session record
  db.prepare(`
    INSERT INTO sessions (id, agent_id, prompt, status, project_tag, workspace_path)
    VALUES (?, ?, ?, 'running', 'meeting', ?)
  `).run(sessionId, agentId, prompt.slice(0, 500), config.workspaceRoot);

  broadcast({ type: 'meetingMessage', meetingId, agentId, phase, content: `[${agentId}] 발언 시작...` });

  const agentInfo = getAgent(agentId);
  // Meeting (토론) = opus for quality, Execution (구현) = sonnet for cost
  const model = phase === 'execution' ? 'sonnet' : 'opus';
  const maxTurns = phase === 'execution' ? 10 : 1;
  const result = await enqueueAgent(agentId, sessionId, prompt, config.workspaceRoot, model, maxTurns);

  // Save message to meeting_messages
  db.prepare(`
    INSERT INTO meeting_messages (id, meeting_id, agent_id, phase, content, tokens_used)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(randomUUID(), meetingId, agentId, phase, result.output.slice(0, 10_000), result.tokensUsed);

  // Track totals
  if (currentMeeting) {
    currentMeeting.totalTokens += result.tokensUsed;
    currentMeeting.totalCostUsd += result.costUsd;
  }

  broadcast({
    type: 'meetingMessage', meetingId, agentId, phase,
    content: result.output.slice(0, 2000),
  });

  return { output: result.output, tokens: result.tokensUsed, cost: result.costUsd };
}

async function executeTasksParallel(
  meetingId: string,
  memories: Map<MeetingAgentId, AgentMemory>,
): Promise<Map<MeetingAgentId, string>> {
  const results = new Map<MeetingAgentId, string>();
  if (!currentMeeting) return results;

  const taskPromises = currentMeeting.tasks.map(async (task) => {
    const memory = memories.get(task.assignee);
    if (!memory) return;

    task.status = 'in_progress';
    const prompt = buildExecutionPrompt(memory, task.task, task.description);
    try {
      const result = await runAgentTurn(task.assignee, meetingId, 'execution', prompt);
      task.status = 'completed';
      results.set(task.assignee, result.output.slice(0, 2000));
    } catch {
      task.status = 'failed';
      results.set(task.assignee, 'Task execution failed');
    }
  });

  await Promise.all(taskPromises);
  return results;
}

function updatePhase(meetingId: string, phase: MeetingPhase): void {
  if (currentMeeting) currentMeeting.status = phase;
  getDb().prepare('UPDATE meetings SET status = ? WHERE id = ?').run(phase, meetingId);
  broadcastStatus(phase);
}

function broadcastStatus(phase: MeetingPhase): void {
  broadcast({
    type: 'meetingUpdate',
    meeting: {
      currentMeeting,
      nextMeetingAt: null,
      totalMeetings: 0,
      schedulerActive: true,
    },
  });
}

function gitCommitAndPush(meetingSeq: number, tokens: number, cost: number): void {
  try {
    const cwd = config.workspaceRoot;
    // Check if there are changes
    const status = execSync('git status --short', { cwd, encoding: 'utf-8' }).trim();
    if (!status) {
      console.log(`[GIT] Meeting #${meetingSeq}: no changes to commit`);
      return;
    }

    const changedFiles = status.split('\n').length;
    execSync('git add -A', { cwd, encoding: 'utf-8' });
    const msg = `Meeting #${meetingSeq}: ${changedFiles} files changed (${tokens} tokens, $${cost.toFixed(4)})`;
    execSync(`git commit -m "${msg}"`, { cwd, encoding: 'utf-8' });
    execSync('git push', { cwd, encoding: 'utf-8', timeout: 30_000 });
    console.log(`[GIT] ${msg} — pushed`);
  } catch (err) {
    console.error('[GIT] commit/push failed:', err instanceof Error ? err.message : err);
  }
}

function getProjectStatus(): string {
  try {
    const status = execSync('git status --short', { cwd: config.workspaceRoot, encoding: 'utf-8' });
    const log = execSync('git log --oneline -5', { cwd: config.workspaceRoot, encoding: 'utf-8' });
    return `### Git Status\n\`\`\`\n${status || '(clean)'}\n\`\`\`\n\n### Recent Commits\n\`\`\`\n${log}\n\`\`\``;
  } catch {
    return 'Git status unavailable';
  }
}

function extractJson<T>(text: string): T | null {
  // Strategy 1: Find JSON in markdown code fence (```json ... ```)
  const fenceMatches = text.matchAll(/```(?:json)?\s*\n([\s\S]*?)\n```/g);
  for (const m of fenceMatches) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (typeof parsed === 'object' && parsed !== null) return parsed as T;
    } catch { /* try next match */ }
  }

  // Strategy 2: Find JSON objects with known keys (non-greedy, brace-balanced)
  const candidates = findJsonObjects(text);
  for (const candidate of candidates) {
    try {
      const parsed = JSON.parse(candidate);
      if (typeof parsed === 'object' && parsed !== null) return parsed as T;
    } catch { /* try next candidate */ }
  }

  return null;
}

/** Extract balanced JSON object substrings from text */
function findJsonObjects(text: string): string[] {
  const results: string[] = [];
  let i = 0;
  while (i < text.length) {
    if (text[i] === '{') {
      let depth = 0;
      let inString = false;
      let escape = false;
      let j = i;
      for (; j < text.length; j++) {
        const ch = text[j];
        if (escape) { escape = false; continue; }
        if (ch === '\\' && inString) { escape = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{') depth++;
        if (ch === '}') { depth--; if (depth === 0) break; }
      }
      if (depth === 0) {
        const candidate = text.slice(i, j + 1);
        if (/"(?:agenda|decisions|tasks|summary|assignee)"/.test(candidate)) {
          results.push(candidate);
        }
      }
    }
    i++;
  }
  return results;
}
