import { create } from 'zustand';
import type { AgentStatus, Session, ActivityEntry, AgentResult } from '@radar/shared';

// Approval request from server
export interface ApprovalRequest {
  sessionId: string;
  agentId: string;
  command: string;
  reason: string;
}

// Completed agent result with metadata
export interface CompletedResult {
  agentId: string;
  result: AgentResult;
  dismissedAt?: number;
}

interface AgentState {
  statuses: Record<string, AgentStatus>;
  sessions: Session[];
  activity: ActivityEntry[];
  // M8: Stream chunks per agent
  chunks: Record<string, string[]>;
  // M10: Selected agent for log viewing
  selectedAgentId: string | null;
  // M10: Completed results (toast queue)
  completedResults: CompletedResult[];
  // M10: Pending approval request
  approvalRequest: ApprovalRequest | null;
  // M10: Current task description per agent
  currentTasks: Record<string, string>;
  // M10: Today's token/cost totals
  todayTokens: number;
  todayCost: number;
  // Permanent record of agents that have completed at least once (survives dismiss)
  completedAgents: Set<string>;

  setStatus: (agentId: string, status: AgentStatus) => void;
  setSessions: (sessions: Session[]) => void;
  setActivity: (activity: ActivityEntry[]) => void;
  addActivity: (entry: ActivityEntry) => void;
  appendChunk: (agentId: string, chunk: string) => void;
  clearChunks: (agentId: string) => void;
  setSelectedAgent: (agentId: string | null) => void;
  addCompletedResult: (agentId: string, result: AgentResult) => void;
  addCompletedAgent: (agentId: string) => void;
  dismissResult: (agentId: string) => void;
  setApprovalRequest: (req: ApprovalRequest | null) => void;
  addTokenCost: (tokens: number, cost: number) => void;
  setCurrentTask: (agentId: string, task: string) => void;
  clearCurrentTask: (agentId: string) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  statuses: {},
  sessions: [],
  activity: [],
  chunks: {},
  selectedAgentId: null,
  completedResults: [],
  approvalRequest: null,
  currentTasks: {},
  todayTokens: 0,
  todayCost: 0,
  completedAgents: new Set<string>(),

  setStatus: (agentId, status) =>
    set((state) => ({
      statuses: { ...state.statuses, [agentId]: status },
    })),

  setSessions: (sessions) => set({ sessions }),
  setActivity: (activity) => set({ activity }),

  addActivity: (entry) =>
    set((state) => ({
      activity: [entry, ...state.activity].slice(0, 100),
    })),

  appendChunk: (agentId, chunk) =>
    set((state) => {
      const prev = state.chunks[agentId] ?? [];
      // Cap at 2000 chunks to prevent memory bloat
      const next = prev.length >= 2000 ? [...prev.slice(-1000), chunk] : [...prev, chunk];
      return { chunks: { ...state.chunks, [agentId]: next } };
    }),

  clearChunks: (agentId) =>
    set((state) => {
      const { [agentId]: _, ...rest } = state.chunks;
      return { chunks: rest };
    }),

  setSelectedAgent: (agentId) => set({ selectedAgentId: agentId }),

  addCompletedResult: (agentId, result) =>
    set((state) => ({
      completedResults: [...state.completedResults, { agentId, result }],
    })),

  addCompletedAgent: (agentId) =>
    set((state) => {
      const next = new Set(state.completedAgents);
      next.add(agentId);
      return { completedAgents: next };
    }),

  dismissResult: (agentId) =>
    set((state) => ({
      completedResults: state.completedResults.filter((r) => r.agentId !== agentId),
    })),

  setApprovalRequest: (req) => set({ approvalRequest: req }),

  addTokenCost: (tokens, cost) =>
    set((state) => ({
      todayTokens: state.todayTokens + tokens,
      todayCost: state.todayCost + cost,
    })),

  setCurrentTask: (agentId, task) =>
    set((state) => ({
      currentTasks: { ...state.currentTasks, [agentId]: task },
    })),

  clearCurrentTask: (agentId) =>
    set((state) => {
      const { [agentId]: _, ...rest } = state.currentTasks;
      return { currentTasks: rest };
    }),
}));
