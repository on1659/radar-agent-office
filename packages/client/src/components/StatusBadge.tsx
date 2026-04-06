import type { AgentStatus } from '@radar/shared';

const STYLE: Record<AgentStatus, { bg: string; label: string }> = {
  idle:    { bg: 'var(--status-idle)',    label: 'Idle' },
  working: { bg: 'var(--status-working)', label: 'Working' },
  error:   { bg: 'var(--status-error)',   label: 'Error' },
  queued:  { bg: 'var(--status-queued)',  label: 'Queued' },
};

export function StatusBadge({ status }: { status: AgentStatus }) {
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
        boxShadow: status === 'working' ? `0 0 6px ${s.bg}` : 'none',
      }} />
      {s.label}
    </span>
  );
}
