// Scheduler — triggers meetings on a configurable interval
import { config } from '../config.js';
import { runMeeting, getCurrentMeeting, getMeetingStatus } from './meeting-engine.js';
import { broadcast } from '../ws/handler.js';
import type { MeetingStatus } from '@radar/shared';

let intervalHandle: ReturnType<typeof setInterval> | null = null;
let nextMeetingAt: Date | null = null;
let active = false;

export function startScheduler(): void {
  if (intervalHandle) return;

  active = true;
  scheduleNext();

  console.log(`  Meeting scheduler started (every ${config.meeting.intervalHours}h)`);
}

export function stopScheduler(): void {
  active = false;
  if (intervalHandle) {
    clearTimeout(intervalHandle);
    intervalHandle = null;
  }
  nextMeetingAt = null;
  console.log('  Meeting scheduler stopped');
}

export function isSchedulerActive(): boolean {
  return active;
}

export function getNextMeetingAt(): string | null {
  return nextMeetingAt?.toISOString() ?? null;
}

export function getSchedulerStatus(): MeetingStatus {
  return getMeetingStatus(getNextMeetingAt());
}

export async function triggerMeetingNow(agenda?: string[]): Promise<void> {
  // Reset timer when manually triggered
  if (intervalHandle) {
    clearTimeout(intervalHandle);
    intervalHandle = null;
  }

  try {
    const meeting = await runMeeting(agenda);
    console.log(`  Meeting #${meeting.sequence} completed (${meeting.totalTokens} tokens, $${meeting.totalCostUsd.toFixed(4)})`);
  } catch (err) {
    console.error('  Meeting failed:', err instanceof Error ? err.message : err);
  }

  // Schedule next if still active
  if (active) scheduleNext();
}

function scheduleNext(): void {
  const ms = config.meeting.intervalHours * 60 * 60 * 1000;
  nextMeetingAt = new Date(Date.now() + ms);

  intervalHandle = setTimeout(async () => {
    intervalHandle = null;

    // Skip if another meeting is running
    if (getCurrentMeeting()) {
      console.log('  Skipping scheduled meeting (one already in progress)');
      if (active) scheduleNext();
      return;
    }

    await triggerMeetingNow();
  }, ms);

  // Broadcast next meeting time
  broadcast({
    type: 'meetingUpdate',
    meeting: getSchedulerStatus(),
  });

  console.log(`  Next meeting at ${nextMeetingAt.toLocaleTimeString()}`);
}
