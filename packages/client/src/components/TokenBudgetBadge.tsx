// Design Ref: §5.3, comparison §8.3[5] — Today's token/cost indicator

interface Props {
  todayTokens: number;
  todayCost: number;
}

export function TokenBudgetBadge({ todayTokens, todayCost }: Props) {
  const formatted = todayCost < 0.01 ? '<$0.01' : `$${todayCost.toFixed(2)}`;
  const tokenK = todayTokens >= 1000 ? `${(todayTokens / 1000).toFixed(1)}k` : String(todayTokens);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '4px 10px',
      borderRadius: 'var(--radius-sm)',
      background: 'var(--bg-tertiary)',
      fontSize: '11px',
      fontFamily: 'var(--font-mono)',
      color: 'var(--text-secondary)',
    }}>
      <span>{tokenK} tokens</span>
      <span style={{ color: 'var(--accent-amber)' }}>{formatted}</span>
    </div>
  );
}
