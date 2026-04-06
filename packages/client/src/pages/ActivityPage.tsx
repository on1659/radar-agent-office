// Design Ref: §5.3 — Activity timeline page
import { useEffect, useState } from 'react';
import type { ActivityEntry } from '@radar/shared';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useAgentStore } from '../store/useAgentStore';

const TYPE_ICONS: Record<string, string> = {
  agent_started: '▶',
  agent_done: '✓',
  agent_error: '✗',
  agent_stopped: '■',
};

const TYPE_COLORS: Record<string, string> = {
  agent_started: 'var(--accent-blue)',
  agent_done: 'var(--accent-green)',
  agent_error: 'var(--accent-red)',
  agent_stopped: 'var(--accent-amber)',
};

export function ActivityPage() {
  const token = useWorkspaceStore((s) => s.token);
  const realtimeActivity = useAgentStore((s) => s.activity);
  const [dbActivity, setDbActivity] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch('/api/activity?limit=50', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => { if (!r.ok) throw new Error(`${r.status}`); return r.json(); })
      .then(data => { setDbActivity(data.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [token]);

  // Merge realtime + DB, deduplicate by id
  const seen = new Set<string>();
  const merged: ActivityEntry[] = [];
  for (const entry of [...realtimeActivity, ...dbActivity]) {
    if (!seen.has(entry.id)) {
      seen.add(entry.id);
      merged.push(entry);
    }
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>
        활동 타임라인
      </h2>

      {loading ? (
        <div style={{ color: 'var(--text-muted)' }}>Loading...</div>
      ) : merged.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', padding: '40px', textAlign: 'center' }}>
          No activity yet. Run an agent from the CommandBar.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {merged.map((entry) => (
            <div key={entry.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 16px',
              background: 'var(--bg-secondary)',
              borderRadius: 'var(--radius-sm)',
            }}>
              <span style={{
                color: TYPE_COLORS[entry.type] ?? 'var(--text-muted)',
                fontSize: '14px',
                width: '20px',
                textAlign: 'center',
                fontWeight: 700,
              }}>
                {TYPE_ICONS[entry.type] ?? '?'}
              </span>
              <span style={{
                fontSize: '12px',
                color: 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                minWidth: '120px',
              }}>
                {entry.timestamp}
              </span>
              <span style={{
                fontSize: '13px',
                fontWeight: 500,
                minWidth: '80px',
                color: 'var(--accent-blue)',
              }}>
                {entry.agentId}
              </span>
              <span style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                flex: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>
                {entry.description}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
