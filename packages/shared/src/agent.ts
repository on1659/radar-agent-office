// === Agent Types ===

export type AgentStatus = 'idle' | 'working' | 'error' | 'queued';

export type Department = 'dev' | 'review' | 'ops' | 'biz' | 'legal' | 'invest';

export type ModelType = 'opus' | 'sonnet' | 'haiku';

export interface Agent {
  id: string;
  name: string;
  department: Department;
  model: ModelType;
  role: string;
  status: AgentStatus;
  currentTask?: string;
  startedAt?: string;
}
