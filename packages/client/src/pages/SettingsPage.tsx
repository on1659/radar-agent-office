import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';

interface ServerConfig {
  port: number;
  workspaceRoot: string;
  claudeCliPath: string;
  maxConcurrent: number;
  meetingIntervalHours: number;
  meetingAutoStart: boolean;
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid var(--border-color)',
    }}>
      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{label}</span>
      <span style={{
        fontSize: '13px',
        color: 'var(--text-primary)',
        fontFamily: mono ? 'var(--font-mono)' : undefined,
        maxWidth: '60%',
        textAlign: 'right',
        wordBreak: 'break-all',
      }}>
        {value}
      </span>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-md)',
      padding: '16px 20px',
      marginBottom: '16px',
    }}>
      <div style={{
        fontSize: '11px',
        fontWeight: 600,
        color: 'var(--text-muted)',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        marginBottom: '4px',
      }}>
        {title}
      </div>
      {children}
    </div>
  );
}

export function SettingsPage() {
  const token = useWorkspaceStore((s) => s.token);
  const setToken = useWorkspaceStore((s) => s.setToken);
  const [cfg, setCfg] = useState<ServerConfig | null>(null);
  const [wsStatus, setWsStatus] = useState<'connected' | 'disconnected'>('disconnected');

  useEffect(() => {
    if (!token) return;
    fetch('/api/config', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setCfg(data); })
      .catch(() => {});

    fetch('/api/health')
      .then(r => { setWsStatus(r.ok ? 'connected' : 'disconnected'); })
      .catch(() => setWsStatus('disconnected'));
  }, [token]);

  const handleClearToken = () => {
    localStorage.removeItem('radar_token');
    setToken('');
    window.location.reload();
  };

  const maskedToken = token
    ? `${token.slice(0, 8)}${'•'.repeat(Math.max(0, token.length - 16))}${token.slice(-8)}`
    : '-';

  return (
    <div style={{ maxWidth: '640px' }}>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>설정</h2>

      <Section title="서버 연결">
        <Row label="상태" value={wsStatus === 'connected' ? '● 연결됨' : '○ 연결 안됨'} />
        {cfg && <Row label="포트" value={String(cfg.port)} mono />}
        <Row label="인증 토큰" value={maskedToken} mono />
        <div style={{ marginTop: '12px' }}>
          <button
            onClick={handleClearToken}
            style={{
              padding: '7px 14px',
              background: 'transparent',
              color: 'var(--accent-red)',
              border: '1px solid var(--accent-red)',
              borderRadius: 'var(--radius-sm)',
              fontSize: '12px',
              cursor: 'pointer',
            }}
          >
            토큰 초기화 (재연결)
          </button>
        </div>
      </Section>

      {cfg && (
        <Section title="워크스페이스">
          <Row label="WORKSPACE_ROOT" value={cfg.workspaceRoot} mono />
          <Row label="CLAUDE_CLI_PATH" value={cfg.claudeCliPath} mono />
          <Row label="MAX_CONCURRENT" value={String(cfg.maxConcurrent)} />
        </Section>
      )}

      {cfg && (
        <Section title="회의 스케줄러">
          <Row label="회의 간격" value={`${cfg.meetingIntervalHours}시간`} />
          <Row label="자동 시작" value={cfg.meetingAutoStart ? 'ON' : 'OFF'} />
        </Section>
      )}

      <Section title="버전">
        <Row label="Radar Agent Office" value="v0.1.0" />
        <Row label="Phase" value="Phase 1 — MVP" />
      </Section>
    </div>
  );
}
