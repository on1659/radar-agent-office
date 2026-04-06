// Design Ref: §5.3 — Agent speech bubble (shown during work)

interface Props {
  text: string;
  style?: React.CSSProperties;
}

export function SpeechBubble({ text, style }: Props) {
  if (!text) return null;

  return (
    <div style={{
      position: 'absolute',
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '4px 10px',
      fontSize: '11px',
      color: 'var(--text-primary)',
      maxWidth: '180px',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      pointerEvents: 'none',
      boxShadow: 'var(--shadow-sm)',
      zIndex: 10,
      ...style,
    }}>
      {text}
      {/* Triangle pointer */}
      <div style={{
        position: 'absolute',
        bottom: '-5px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 0,
        height: 0,
        borderLeft: '5px solid transparent',
        borderRight: '5px solid transparent',
        borderTop: '5px solid var(--border-color)',
      }} />
    </div>
  );
}
