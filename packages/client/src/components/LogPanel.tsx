// Design Ref: §5.3 — Real-time work log streaming panel
import { useState, useEffect, useRef } from 'react';

interface Props {
  agentId: string | null;
  chunks: string[];
  height?: string;
}

export function LogPanel({ agentId, chunks, height }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chunks]);

  if (!agentId) {
    return (
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-md)',
        padding: '16px',
        color: 'var(--text-muted)',
        fontSize: '13px',
        height: height ?? '200px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        Select an agent to view logs
      </div>
    );
  }

  return (
    <div style={{
      background: '#0d0d1a',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      height: height ?? '200px',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{
        padding: '8px 12px',
        borderBottom: '1px solid var(--border-color)',
        fontSize: '11px',
        color: 'var(--text-muted)',
        fontFamily: 'var(--font-mono)',
      }}>
        {agentId} — live output
      </div>
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflow: 'auto',
          padding: '8px 12px',
          fontFamily: 'var(--font-mono)',
          fontSize: '12px',
          lineHeight: 1.6,
          color: 'var(--accent-green)',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-all',
        }}
      >
        {chunks.length === 0 ? 'Waiting for output...' : chunks.join('')}
      </div>
    </div>
  );
}
