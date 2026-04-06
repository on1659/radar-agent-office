// === Session & API Types ===

export interface Session {
  id: string;
  agentId: string;
  prompt: string;
  result?: string;
  status: 'running' | 'completed' | 'error' | 'stopped';
  tokensUsed?: number;
  inputTokens?: number;
  outputTokens?: number;
  costUsd?: number;
  projectTag?: string;
  startedAt: string;
  completedAt?: string;
}

export interface AgentResult {
  output: string;
  filesChanged: string[];
  tokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  duration: number;
  exitCode: number;
}

export interface CostSummary {
  agentId: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  sessionCount: number;
  date?: string;
}

export interface ActivityEntry {
  id: string;
  type: 'agent_started' | 'agent_done' | 'agent_error' | 'agent_stopped';
  agentId: string;
  sessionId?: string;
  description: string;
  timestamp: string;
}
