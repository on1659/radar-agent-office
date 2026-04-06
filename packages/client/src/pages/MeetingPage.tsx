import { useEffect, useState } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useMeetingStore, type MeetingRow, type MeetingDetailRow } from '../store/useMeetingStore';

const AGENT_NAMES: Record<string, string> = {
  pd: '민준 (PD)',
  developer: '서진 (Dev)',
  planner: '하은 (Plan)',
  'ui-designer': '도윤 (UI)',
};

const AGENT_COLORS: Record<string, string> = {
  pd: 'var(--accent-blue)',
  developer: 'var(--accent-green)',
  planner: 'var(--accent-amber)',
  'ui-designer': 'var(--accent-purple, #a78bfa)',
};

const PHASE_LABELS: Record<string, string> = {
  'context-loading': '맥락 로딩',
  opening: 'PD 오프닝',
  discussion: '팀 토론',
  decision: 'PD 결정',
  execution: '태스크 실행',
  'memory-update': '메모리 저장',
  completed: '완료',
  failed: '실패',
};

export function MeetingPage() {
  const token = useWorkspaceStore((s) => s.token);
  const {
    status, meetings, currentDetail, loading, starting,
    fetchStatus, fetchMeetings, fetchDetail, startMeeting, toggleScheduler,
  } = useMeetingStore();

  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    fetchStatus(token);
    fetchMeetings(token);
    const interval = setInterval(() => fetchStatus(token), 5000);
    return () => clearInterval(interval);
  }, [token, fetchStatus, fetchMeetings]);

  useEffect(() => {
    if (selectedId && token) fetchDetail(token, selectedId);
  }, [selectedId, token, fetchDetail]);

  const currentPhase = status?.currentMeeting?.status;
  const nextAt = status?.nextMeetingAt
    ? new Date(status.nextMeetingAt).toLocaleTimeString()
    : '-';

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>
        에이전트 회의
      </h2>

      {/* Status Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        marginBottom: '24px',
      }}>
        <StatCard
          label="회의 상태"
          value={currentPhase ? PHASE_LABELS[currentPhase] ?? currentPhase : '대기 중'}
          accent={currentPhase ? 'var(--accent-blue)' : 'var(--text-muted)'}
          pulse={!!currentPhase}
        />
        <StatCard
          label="총 회의"
          value={String(status?.totalMeetings ?? 0)}
          accent="var(--accent-green)"
        />
        <StatCard
          label="다음 회의"
          value={nextAt}
          accent="var(--accent-amber)"
        />
        <StatCard
          label="스케줄러"
          value={status?.schedulerActive ? 'ON' : 'OFF'}
          accent={status?.schedulerActive ? 'var(--accent-green)' : 'var(--accent-red)'}
        />
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
        <button
          onClick={() => startMeeting(token)}
          disabled={starting || !!currentPhase}
          style={{
            padding: '8px 16px',
            background: (starting || !!currentPhase) ? 'var(--bg-hover)' : 'var(--accent-blue)',
            color: (starting || !!currentPhase) ? 'var(--text-muted)' : '#fff',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: (starting || !!currentPhase) ? 'not-allowed' : 'pointer',
          }}
        >
          {starting ? '시작 중...' : currentPhase ? '회의 진행 중' : '회의 시작'}
        </button>
        <button
          onClick={() => toggleScheduler(token)}
          style={{
            padding: '8px 16px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          스케줄러 {status?.schedulerActive ? 'OFF' : 'ON'}
        </button>
        <button
          onClick={() => { fetchStatus(token); fetchMeetings(token); }}
          style={{
            padding: '8px 16px',
            background: 'var(--bg-secondary)',
            color: 'var(--text-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            fontSize: '13px',
            cursor: 'pointer',
          }}
        >
          새로고침
        </button>
      </div>

      {/* Live Meeting Progress */}
      {currentPhase && status?.currentMeeting && (
        <LiveMeetingCard meeting={status.currentMeeting} />
      )}

      {/* Main Content: Meeting List + Detail */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 2fr',
        gap: '16px',
        minHeight: '400px',
      }}>
        {/* Meeting List */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          overflow: 'auto',
        }}>
          <div style={{
            padding: '12px 16px',
            borderBottom: '1px solid var(--border-color)',
            fontSize: '13px',
            fontWeight: 600,
          }}>
            회의 이력
          </div>
          {loading ? (
            <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>
              Loading...
            </div>
          ) : meetings.length === 0 ? (
            <div style={{ padding: '20px', color: 'var(--text-muted)', textAlign: 'center' }}>
              아직 회의가 없습니다
            </div>
          ) : (
            meetings.map((m) => (
              <MeetingListItem
                key={m.id}
                meeting={m}
                selected={selectedId === m.id}
                onClick={() => setSelectedId(m.id)}
              />
            ))
          )}
        </div>

        {/* Meeting Detail */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: 'var(--radius-md)',
          overflow: 'auto',
        }}>
          {currentDetail ? (
            <MeetingDetailView detail={currentDetail} />
          ) : (
            <div style={{
              padding: '40px',
              color: 'var(--text-muted)',
              textAlign: 'center',
              fontSize: '13px',
            }}>
              좌측에서 회의를 선택하세요
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// --- Sub Components ---

function StatCard({ label, value, accent, pulse }: {
  label: string; value: string; accent: string; pulse?: boolean;
}) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-md)',
      padding: '16px',
      borderLeft: `3px solid ${accent}`,
    }}>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>
        {label}
      </div>
      <div style={{
        fontSize: '16px',
        fontWeight: 600,
        color: accent,
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
      }}>
        {pulse && (
          <span style={{
            width: 8, height: 8, borderRadius: '50%',
            background: accent,
            boxShadow: `0 0 8px ${accent}`,
            animation: 'pulse 1.5s infinite',
          }} />
        )}
        {value}
      </div>
    </div>
  );
}

function LiveMeetingCard({ meeting }: { meeting: { status: string; sequence: number } }) {
  const phases = ['context-loading', 'opening', 'discussion', 'decision', 'execution', 'memory-update'];
  const currentIdx = phases.indexOf(meeting.status);

  return (
    <div style={{
      background: 'var(--bg-secondary)',
      borderRadius: 'var(--radius-md)',
      padding: '16px',
      marginBottom: '24px',
      border: '1px solid var(--accent-blue)',
    }}>
      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
        Meeting #{meeting.sequence} 진행 중
      </div>
      <div style={{ display: 'flex', gap: '4px' }}>
        {phases.map((phase, i) => (
          <div key={phase} style={{
            flex: 1,
            height: '6px',
            borderRadius: '3px',
            background: i <= currentIdx
              ? (i === currentIdx ? 'var(--accent-blue)' : 'var(--accent-green)')
              : 'var(--bg-hover)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        marginTop: '8px',
        fontSize: '11px',
        color: 'var(--text-muted)',
      }}>
        {phases.map((phase, i) => (
          <span key={phase} style={{
            color: i === currentIdx ? 'var(--accent-blue)' : 'var(--text-muted)',
            fontWeight: i === currentIdx ? 600 : 400,
          }}>
            {PHASE_LABELS[phase]?.slice(0, 4) ?? phase.slice(0, 4)}
          </span>
        ))}
      </div>
    </div>
  );
}

function MeetingListItem({ meeting, selected, onClick }: {
  meeting: MeetingRow; selected: boolean; onClick: () => void;
}) {
  const date = new Date(meeting.started_at);
  const tokens = meeting.total_tokens ?? 0;
  const cost = meeting.total_cost_usd ?? 0;

  return (
    <div
      onClick={onClick}
      style={{
        padding: '10px 16px',
        cursor: 'pointer',
        background: selected ? 'var(--bg-hover)' : 'transparent',
        borderLeft: selected ? '3px solid var(--accent-blue)' : '3px solid transparent',
        transition: 'all 0.15s',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: '13px', fontWeight: 600 }}>
          #{meeting.sequence}
        </span>
        <span style={{
          fontSize: '11px',
          padding: '2px 6px',
          borderRadius: '3px',
          background: meeting.status === 'completed' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
          color: meeting.status === 'completed' ? 'var(--accent-green)' : 'var(--accent-red)',
        }}>
          {meeting.status}
        </span>
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
        {date.toLocaleDateString()} {date.toLocaleTimeString()}
      </div>
      {tokens > 0 && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
          {tokens.toLocaleString()} tokens · ${cost.toFixed(4)}
        </div>
      )}
    </div>
  );
}

interface MeetingDetailProps {
  detail: MeetingDetailRow;
}

function MeetingDetailView({ detail }: MeetingDetailProps) {
  const [tab, setTab] = useState<'conversation' | 'decisions' | 'tasks'>('conversation');
  const decisions = Array.isArray(detail.decisions) ? detail.decisions : [];
  const tasks = Array.isArray(detail.tasks) ? detail.tasks : [];
  const agenda = Array.isArray(detail.agenda) ? detail.agenda : [];

  return (
    <div>
      {/* Header */}
      <div style={{
        padding: '12px 16px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <span style={{ fontSize: '14px', fontWeight: 600 }}>
          Meeting #{detail.sequence}
        </span>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {(detail.total_tokens ?? 0).toLocaleString()} tokens
          {' · '}
          ${(detail.total_cost_usd ?? 0).toFixed(4)}
        </span>
      </div>

      {/* Agenda */}
      {agenda.length > 0 && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
            안건
          </div>
          {agenda.map((a, i) => (
            <div key={i} style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '2px' }}>
              {i + 1}. {String(a)}
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '0',
        borderBottom: '1px solid var(--border-color)',
      }}>
        {(['conversation', 'decisions', 'tasks'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '8px',
              background: 'transparent',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--accent-blue)' : '2px solid transparent',
              color: tab === t ? 'var(--accent-blue)' : 'var(--text-muted)',
              fontSize: '12px',
              fontWeight: tab === t ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {t === 'conversation' ? `대화 (${detail.messages.length})` :
             t === 'decisions' ? `결정 (${decisions.length})` :
             `태스크 (${tasks.length})`}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ padding: '12px 16px', maxHeight: '500px', overflow: 'auto' }}>
        {tab === 'conversation' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {detail.messages.map((msg) => (
              <div key={msg.id} style={{
                padding: '10px 12px',
                background: 'var(--bg-primary)',
                borderRadius: 'var(--radius-sm)',
                borderLeft: `3px solid ${AGENT_COLORS[msg.agent_id] ?? 'var(--text-muted)'}`,
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '6px',
                }}>
                  <span style={{
                    fontSize: '12px',
                    fontWeight: 600,
                    color: AGENT_COLORS[msg.agent_id] ?? 'var(--text-primary)',
                  }}>
                    {AGENT_NAMES[msg.agent_id] ?? msg.agent_id}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                    {PHASE_LABELS[msg.phase] ?? msg.phase}
                    {msg.tokens_used > 0 && ` · ${msg.tokens_used.toLocaleString()}t`}
                  </span>
                </div>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.5,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  maxHeight: '200px',
                  overflow: 'auto',
                }}>
                  {msg.content || '(empty)'}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'decisions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {decisions.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>결정사항 없음</div>
            ) : (
              decisions.map((d, i) => (
                <div key={i} style={{
                  padding: '8px 12px',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  borderLeft: '3px solid var(--accent-green)',
                }}>
                  {String(d)}
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'tasks' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {tasks.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', fontSize: '13px' }}>태스크 없음</div>
            ) : (
              tasks.map((t, i) => (
                <div key={i} style={{
                  padding: '10px 12px',
                  background: 'var(--bg-primary)',
                  borderRadius: 'var(--radius-sm)',
                  borderLeft: `3px solid ${AGENT_COLORS[t.assignee] ?? 'var(--text-muted)'}`,
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '4px',
                  }}>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      color: AGENT_COLORS[t.assignee] ?? 'var(--text-primary)',
                    }}>
                      {AGENT_NAMES[t.assignee] ?? t.assignee}
                    </span>
                    <span style={{
                      fontSize: '11px',
                      padding: '1px 6px',
                      borderRadius: '3px',
                      background: t.status === 'completed' ? 'rgba(34,197,94,0.15)' :
                                  t.status === 'failed' ? 'rgba(239,68,68,0.15)' :
                                  'rgba(59,130,246,0.15)',
                      color: t.status === 'completed' ? 'var(--accent-green)' :
                             t.status === 'failed' ? 'var(--accent-red)' :
                             'var(--accent-blue)',
                    }}>
                      {t.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>{t.task}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    {t.description}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
