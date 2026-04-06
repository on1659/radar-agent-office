import { create } from 'zustand';
import type { WorkspaceOverview, Agent, Skill, Hook, Rule } from '@radar/shared';

interface WorkspaceState {
  overview: WorkspaceOverview | null;
  agents: Agent[];
  skills: Skill[];
  hooks: Hook[];
  rules: Rule[];
  loading: boolean;
  token: string;
  setToken: (token: string) => void;
  fetchOverview: () => Promise<void>;
  fetchAgents: () => Promise<void>;
  fetchAll: () => Promise<void>;
}

const headers = (token: string) => ({ Authorization: `Bearer ${token}` });

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  overview: null,
  agents: [],
  skills: [],
  hooks: [],
  rules: [],
  loading: false,
  token: '',

  setToken: (token) => set({ token }),

  fetchOverview: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const res = await fetch('/api/workspace/overview', { headers: headers(token) });
      if (res.status === 401 || res.status === 403) { set({ token: '' }); return; }
      if (res.ok) set({ overview: await res.json() });
    } catch { /* network error */ }
  },

  fetchAgents: async () => {
    const { token } = get();
    if (!token) return;
    try {
      const res = await fetch('/api/workspace/agents', { headers: headers(token) });
      if (res.status === 401 || res.status === 403) { set({ token: '' }); return; }
      if (res.ok) set({ agents: await res.json() });
    } catch { /* network error */ }
  },

  fetchAll: async () => {
    set({ loading: true });
    const { token } = get();
    if (!token) { set({ loading: false }); return; }

    try {
      const [overviewRes, agentsRes, skillsRes, hooksRes, rulesRes] = await Promise.all([
        fetch('/api/workspace/overview', { headers: headers(token) }),
        fetch('/api/workspace/agents', { headers: headers(token) }),
        fetch('/api/workspace/skills', { headers: headers(token) }),
        fetch('/api/workspace/hooks', { headers: headers(token) }),
        fetch('/api/workspace/rules', { headers: headers(token) }),
      ]);

      set({
        overview: overviewRes.ok ? await overviewRes.json() : null,
        agents: agentsRes.ok ? await agentsRes.json() : [],
        skills: skillsRes.ok ? await skillsRes.json() : [],
        hooks: hooksRes.ok ? await hooksRes.json() : [],
        rules: rulesRes.ok ? await rulesRes.json() : [],
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },
}));
