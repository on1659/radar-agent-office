// M10: Toast notification when agent completes work
import type { AgentResult } from '@radar/shared';

interface Props {
  agentId: string;
  result: AgentResult;
  onDismiss: () => void;
}

export function CompletionToast({ agentId, result, onDismiss }: Props) {
  const isError = result.exitCode !== 0;
  const borderColor = isError ? 'var(--accent-red)' : 'var(--accent-green)';
  const tokenK = result.tokensUsed >= 1000
    ? `${(result.tokensUsed / 1000).toFixed(1)}k`
    : String(result.tokensUsed);
  const costStr = result.costUsd < 0.01 ? '<$0.01' : `$${result.costUsd.toFixed(2)}`;
  const durationStr = result.duration < 1000
    ? `${result.duration}ms`
    : `${(result.duration / 1000).toFixed(1)}s`;

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: `1px solid ${borderColor}`,
      borderRadius: 'var(--radius-md)',
      padding: '12px 16px',
      width: '340px',
      boxShadow: 'var(--shadow-lg)',
      animation: 'slideIn 0.2s ease-out',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <span style={{ fontSize: '13px', fontWeight: 600, color: borderColor }}>
          {isError ? '✗ Error' : '✓ Completed'} — {agentId}
        </span>
        <button
          onClick={onDismiss}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0 4px',
          }}
        >
          ×
        </button>
      </div>

      {/* Stats row */}
      <div style={{
        display: 'flex',
        gap: '12px',
        fontSize: '11px',
        fontFamily: 'var(--font-mono)',
        color: 'var(--text-secondary)',
        marginBottom: '8px',
      }}>
        <span>{tokenK} tokens</span>
        <span style={{ color: 'var(--accent-amber)' }}>{costStr}</span>
        <span>{durationStr}</span>
        {result.filesChanged.length > 0 && (
          <span style={{ color: 'var(--accent-blue)' }}>
            {result.filesChanged.length} file{result.filesChanged.length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Output preview */}
      {result.output && (
        <div style={{
          background: 'var(--bg-primary)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 8px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          maxHeight: '60px',
          overflow: 'hidden',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}>
          {result.output.slice(-200)}
        </div>
      )}
    </div>
  );
}
