// Agent Memory Service — read/write per-agent identity, journal, focus, meetings
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { config } from '../config.js';
import { getActiveAgentIds } from './agent-registry.js';
import type { MeetingAgentId, AgentMemory } from '@radar/shared';

function agentDir(agentId: MeetingAgentId): string {
  return join(config.meeting.agentMemoryDir, agentId);
}

function readFileSafe(path: string): string {
  try {
    return readFileSync(path, 'utf-8');
  } catch {
    return '';
  }
}

/** Load full memory for one agent */
export function loadAgentMemory(agentId: MeetingAgentId): AgentMemory {
  const dir = agentDir(agentId);

  const identity = readFileSafe(join(dir, 'identity.md'));
  const fullJournal = readFileSafe(join(dir, 'journal.md'));
  const currentFocus = readFileSafe(join(dir, 'current-focus.md'));

  // Parse journal: keep only the most recent N entries
  const journal = trimJournal(fullJournal, config.meeting.maxJournalEntries);

  // Load recent meeting notes
  const meetingsDir = join(dir, 'meetings');
  const recentMeetings = loadRecentMeetings(meetingsDir, config.meeting.maxRecentMeetings);

  return { agentId, identity, journal, currentFocus, recentMeetings };
}

/** Load memory for all active agents */
export function loadAllAgentMemories(): Map<MeetingAgentId, AgentMemory> {
  const memories = new Map<MeetingAgentId, AgentMemory>();
  for (const id of getActiveAgentIds()) {
    memories.set(id, loadAgentMemory(id));
  }
  return memories;
}

/** Append a journal entry */
export function appendJournal(agentId: MeetingAgentId, entry: string): void {
  const path = join(agentDir(agentId), 'journal.md');
  const existing = readFileSafe(path);
  const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');
  const newEntry = `\n## [${timestamp}]\n\n${entry.trim()}\n`;
  writeFileSync(path, existing + newEntry, 'utf-8');
}

/** Update current focus */
export function updateFocus(agentId: MeetingAgentId, focus: string): void {
  const path = join(agentDir(agentId), 'current-focus.md');
  writeFileSync(path, focus, 'utf-8');
}

/** Save meeting notes for an agent */
export function saveMeetingNotes(
  agentId: MeetingAgentId,
  meetingSeq: number,
  content: string,
): void {
  const meetingsDir = join(agentDir(agentId), 'meetings');
  if (!existsSync(meetingsDir)) {
    mkdirSync(meetingsDir, { recursive: true });
  }
  const date = new Date().toISOString().slice(0, 10);
  const filename = `${date}-${String(meetingSeq).padStart(3, '0')}.md`;
  writeFileSync(join(meetingsDir, filename), content, 'utf-8');
}

/** Get all focus summaries (for PD context) */
export function getAllFocusSummaries(): Record<MeetingAgentId, string> {
  const result = {} as Record<MeetingAgentId, string>;
  for (const id of getActiveAgentIds()) {
    result[id] = readFileSafe(join(agentDir(id), 'current-focus.md'));
  }
  return result;
}

// --- Internal helpers ---

function trimJournal(journal: string, maxEntries: number): string {
  // Split by ## [...] headers
  const entries = journal.split(/(?=^## \[)/m).filter((e) => e.trim());
  if (entries.length <= maxEntries) return journal;
  return entries.slice(-maxEntries).join('');
}

function loadRecentMeetings(dir: string, max: number): string[] {
  if (!existsSync(dir)) return [];
  const files = readdirSync(dir)
    .filter((f) => f.endsWith('.md'))
    .sort()
    .slice(-max);
  return files.map((f) => readFileSafe(join(dir, f)));
}
