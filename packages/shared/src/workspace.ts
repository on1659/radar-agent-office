// === Workspace Types ===

export interface WorkspaceOverview {
  agents: number;
  skills: number;
  hooks: number;
  rules: number;
  pipelines: number;
  mcpServers: number;
  total: number;
  activeJobs: number;
  modelDistribution: Record<string, number>;
}

export interface Skill {
  name: string;
  path: string;
  description: string;
  type: 'workflow' | 'capability' | 'hybrid';
}

export interface Hook {
  event: string;
  command: string;
  type: 'shell' | 'http';
}

export interface Rule {
  content: string;
  source: string;
  priority: 'urgent' | 'important' | 'normal';
}
