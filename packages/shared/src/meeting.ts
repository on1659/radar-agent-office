// === Meeting System Types ===

export type MeetingPhase =
  | 'context-loading'
  | 'opening'
  | 'discussion'
  | 'decision'
  | 'execution'
  | 'memory-update'
  | 'completed'
  | 'failed';

/** Agent ID — dynamic, not limited to preset roles */
export type MeetingAgentId = string;

export type AgentRole = 'pd' | 'developer' | 'planner' | 'designer' | 'qa' | 'devops' | 'custom';

export type ModelType = 'opus' | 'sonnet' | 'haiku';

/** Registered team agent definition */
export interface TeamAgent {
  id: string;
  name: string;
  role: AgentRole;
  model: ModelType;
  active: boolean;
  isPd: boolean;
  createdAt: string;
}

export interface MeetingMessage {
  id: string;
  meetingId: string;
  agentId: MeetingAgentId;
  phase: MeetingPhase;
  content: string;
  tokensUsed: number;
  createdAt: string;
}

export interface MeetingTask {
  assignee: MeetingAgentId;
  task: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

export interface Meeting {
  id: string;
  sequence: number;
  status: MeetingPhase;
  agenda: string[];
  decisions: string[];
  tasks: MeetingTask[];
  participants: MeetingAgentId[];
  totalTokens: number;
  totalCostUsd: number;
  startedAt: string;
  completedAt?: string;
}

export interface MeetingStatus {
  currentMeeting: Meeting | null;
  nextMeetingAt: string | null;
  totalMeetings: number;
  schedulerActive: boolean;
}

export interface AgentMemory {
  agentId: MeetingAgentId;
  identity: string;
  journal: string;
  currentFocus: string;
  recentMeetings: string[];
}
