import { useEffect } from 'react';
import type { AgentStatus } from '@radar/shared';

// Phase 1.5: inline @keyframes — injected once to document.head, no external CSS file
const KEYFRAME_ID = 'radar-status-pulse';

const STYLE: Record<AgentStatus, { bg: string; label: string }> = {
  idle:    { bg: 'var(--status-idle)',    label: 'Idle' },
  working: { bg: 'var(--status-working)', label: 'Working' },
  error:   { bg: 'var(--status-error)',   label: 'Error' },
  queued:  { bg: 'var(--status-queued)',  label: 'Queued' },
};

export function StatusBadge({ status }: { status: AgentStatus }) {
  useEffect(() => {
    if (document.getElementById(KEYFRAME_ID)) return;
    const el = document.createElement('style');
    el.id = KEYFRAME_ID;
    el.textContent =
      '@keyframes radar-pulse {' +
      '  0%, 100% { box-shadow: 0 0 4px var(--status-working); }' +
      '  50%       { box-shadow: 0 0 12px var(--status-working), 0 0 24px var(--status-working); }' +
      '}';
    document.head.appendChild(el);
  }, []);

  const s = STYLE[status];
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '12px',
      color: 'var(--text-primary)',
    }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: s.bg,
        animation: status === 'working' ? 'radar-pulse 1.5s ease-in-out infinite' : 'none',
      }} />
      {s.label}
    </span>
  );
}
