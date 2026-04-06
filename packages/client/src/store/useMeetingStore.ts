import { create } from 'zustand';
import type { MeetingStatus } from '@radar/shared';

// API responses use snake_case from SQLite
export interface MeetingRow {
  id: string;
  sequence: number;
  status: string;
  agenda: unknown[];
  decisions: unknown[];
  tasks: Array<{ assignee: string; task: string; description: string; status: string }>;
  participants: string[];
  total_tokens: number;
  total_cost_usd: number;
  started_at: string;
  completed_at?: string;
}

export interface MeetingDetailRow extends MeetingRow {
  messages: Array<{
    id: string; agent_id: string; phase: string; content: string;
    tokens_used: number; created_at: string;
  }>;
}

interface MeetingState {
  status: MeetingStatus | null;
  meetings: MeetingRow[];
  currentDetail: MeetingDetailRow | null;
  loading: boolean;
  starting: boolean;

  fetchStatus: (token: string) => Promise<void>;
  fetchMeetings: (token: string) => Promise<void>;
  fetchDetail: (token: string, id: string) => Promise<void>;
  startMeeting: (token: string) => Promise<void>;
  toggleScheduler: (token: string) => Promise<void>;
  updateStatus: (status: MeetingStatus) => void;
}

const headers = (token: string) => ({ Authorization: `Bearer ${token}` });

export const useMeetingStore = create<MeetingState>((set, get) => ({
  status: null,
  meetings: [],
  currentDetail: null,
  loading: false,
  starting: false,

  fetchStatus: async (token) => {
    try {
      const res = await fetch('/api/scheduler/status', { headers: headers(token) });
      if (res.ok) set({ status: await res.json() });
    } catch { /* network error */ }
  },

  fetchMeetings: async (token) => {
    set({ loading: true });
    try {
      const res = await fetch('/api/meetings?limit=20', { headers: headers(token) });
      if (res.ok) set({ meetings: await res.json(), loading: false });
      else set({ loading: false });
    } catch { set({ loading: false }); }
  },

  fetchDetail: async (token, id) => {
    try {
      const res = await fetch(`/api/meetings/${id}`, { headers: headers(token) });
      if (res.ok) set({ currentDetail: await res.json() });
    } catch { /* network error */ }
  },

  startMeeting: async (token) => {
    set({ starting: true });
    try {
      await fetch('/api/meetings/start', {
        method: 'POST',
        headers: { ...headers(token), 'Content-Type': 'application/json' },
        body: '{}',
      });
      // Refresh status after short delay
      setTimeout(() => { get().fetchStatus(token); set({ starting: false }); }, 2000);
    } catch { set({ starting: false }); }
  },

  toggleScheduler: async (token) => {
    try {
      const res = await fetch('/api/scheduler/toggle', {
        method: 'POST',
        headers: headers(token),
      });
      if (res.ok) get().fetchStatus(token);
    } catch { /* network error */ }
  },

  updateStatus: (status) => set({ status }),
}));
