// Design Ref: §5.3, comparison §8.3[3] — Dangerous action confirmation dialog

interface Props {
  agentId: string;
  command: string;
  reason: string;
  onApprove: () => void;
  onReject: () => void;
}

export function ApprovalModal({ agentId, command, reason, onApprove, onReject }: Props) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--accent-red)',
        borderRadius: 'var(--radius-lg)',
        padding: '24px',
        width: '420px',
        maxWidth: '90vw',
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--accent-red)', marginBottom: '12px' }}>
          Approval Required
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>
          <strong>{agentId}</strong> wants to execute a potentially dangerous action:
        </p>
        <pre style={{
          background: 'var(--bg-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '10px',
          fontSize: '12px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--accent-amber)',
          overflow: 'auto',
          maxHeight: '100px',
          marginBottom: '8px',
        }}>
          {command}
        </pre>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Reason: {reason}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <button onClick={onReject} style={{
            background: 'var(--bg-tertiary)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 20px',
            fontSize: '13px',
            cursor: 'pointer',
          }}>
            Reject
          </button>
          <button onClick={onApprove} style={{
            background: 'var(--accent-red)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '8px 20px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}>
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
