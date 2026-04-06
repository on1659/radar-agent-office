// Design Ref: §3.2 — SQLite Schema (v0.2: Paperclip 채택 항목 반영)

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  result TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  tokens_used INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd REAL,
  project_tag TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  workspace_path TEXT
);

CREATE TABLE IF NOT EXISTS daily_stats (
  date TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  PRIMARY KEY (date, agent_id, tool_name)
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  session_id TEXT REFERENCES sessions(id),
  description TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_sessions_agent ON sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_sessions_status ON sessions(status);
CREATE INDEX IF NOT EXISTS idx_sessions_project ON sessions(project_tag);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_activity_log_time ON activity_log(timestamp);

CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  sequence INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'context-loading',
  agenda TEXT,
  decisions TEXT,
  tasks TEXT,
  participants TEXT NOT NULL DEFAULT '["pd","developer","planner","ui-designer"]',
  total_tokens INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS meeting_messages (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES meetings(id),
  agent_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_meetings_status ON meetings(status);
CREATE INDEX IF NOT EXISTS idx_meeting_messages_meeting ON meeting_messages(meeting_id);

CREATE TABLE IF NOT EXISTS team_agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'custom',
  model TEXT NOT NULL DEFAULT 'sonnet',
  active INTEGER NOT NULL DEFAULT 1,
  is_pd INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
