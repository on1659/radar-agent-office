// === WebSocket Event Types ===

import type { AgentStatus } from './agent.js';
import type { AgentResult, ActivityEntry } from './api.js';
import type { WorkspaceOverview } from './workspace.js';
import type { MeetingStatus, MeetingAgentId } from './meeting.js';

export type ServerEvent =
  | { type: 'agentStream'; agentId: string; chunk: string }
  | { type: 'agentQueued'; agentId: string; position: number }
  | { type: 'agentDone'; agentId: string; result: AgentResult }
  | { type: 'statusUpdate'; agentId: string; status: AgentStatus }
  | { type: 'workspaceUpdate'; overview: WorkspaceOverview }
  | { type: 'approvalRequest'; sessionId: string; agentId: string; command: string; reason: string }
  | { type: 'activityEvent'; entry: ActivityEntry }
  | { type: 'meetingUpdate'; meeting: MeetingStatus }
  | { type: 'meetingMessage'; meetingId: string; agentId: MeetingAgentId; phase: string; content: string };

export type ClientEvent =
  | { type: 'runAgent'; agentId: string; prompt: string; workspace?: string; projectTag?: string }
  | { type: 'stopAgent'; agentId: string }
  | { type: 'approvalResponse'; sessionId: string; approved: boolean }
  | { type: 'startMeeting'; agenda?: string[] }
  | { type: 'stopMeeting'; meetingId: string };
