// Design Ref: §5.4 — Agents list page, 1:2 split layout
import { useEffect } from 'react';
import type { AgentStatus } from '@radar/shared';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useAgentStore } from '../store/useAgentStore';
import { StatusBadge } from '../components/StatusBadge';
import { LogPanel } from '../components/LogPanel';

const STATUS_ORDER: Record<AgentStatus, number> = {
  working: 0,
  queued:  1,
  idle:    2,
  error:   3,
};

const STATUS_BG: Record<AgentStatus, string> = {
  idle:    'transparent',
  working: 'rgba(74,158,255,0.05)',
  error:   'rgba(248,113,113,0.05)',
  queued:  'rgba(251,191,36,0.05)',
};

export function AgentsPage() {
  const agents        = useWorkspaceStore((s) => s.agents);
  const fetchAgents   = useWorkspaceStore((s) => s.fetchAgents);

  const statuses         = useAgentStore((s) => s.statuses);
  const chunks           = useAgentStore((s) => s.chunks);
  const selectedAgentId  = useAgentStore((s) => s.selectedAgentId);
  const setSelectedAgent = useAgentStore((s) => s.setSelectedAgent);
  const completedResults = useAgentStore((s) => s.completedResults);
  const currentTasks     = useAgentStore((s) => s.currentTasks);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  // Merge agent status + sort: working → queued → idle → error
  const sorted = [...agents].sort((a, b) => {
    const sa = statuses[a.id] ?? 'idle';
    const sb = statuses[b.id] ?? 'idle';
    return STATUS_ORDER[sa] - STATUS_ORDER[sb];
  });

  const selectedChunks = selectedAgentId ? (chunks[selectedAgentId] ?? []) : [];

  return (
    <div style={{ display: 'flex', height: '100%', gap: '0', overflow: 'hidden' }}>
      {/* Left 1/3 — Agent list */}
      <div style={{
        width: '33.33%',
        borderRight: '1px solid var(--border-color)',
        overflow: 'auto',
        flexShrink: 0,
      }}>
        <div style={{
          padding: '16px',
          borderBottom: '1px solid var(--border-color)',
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-primary)',
        }}>
          에이전트 목록
        </div>

        {sorted.map((agent) => {
          const status    = statuses[agent.id] ?? 'idle';
          const isSelected = selectedAgentId === agent.id;
          const completed  = completedResults.find((r) => r.agentId === agent.id);
          const task       = currentTasks[agent.id];

          return (
            <div
              key={agent.id}
              onClick={() => setSelectedAgent(isSelected ? null : agent.id)}
              style={{
                padding: '12px 16px',
                borderBottom: '1px solid var(--border-color)',
                background: isSelected
                  ? 'rgba(74,158,255,0.12)'
                  : STATUS_BG[status],
                cursor: 'pointer',
                transition: 'background 0.1s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <StatusBadge status={status} />
                <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>
                  {agent.name}
                </span>
                <span style={{
                  marginLeft: 'auto',
                  background: agent.model === 'opus'   ? 'var(--model-opus)'
                            : agent.model === 'sonnet' ? 'var(--model-sonnet)'
                            : 'var(--model-haiku)',
                  color: '#000',
                  borderRadius: '4px',
                  padding: '2px 5px',
                  fontSize: '10px',
                  fontWeight: 700,
                }}>
                  {agent.model}
                </span>
              </div>

              <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: task || completed ? '6px' : '0' }}>
                {agent.department} · {agent.role}
              </div>

              {/* Current task */}
              {task && (
                <div style={{
                  fontSize: '11px',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {task}
                </div>
              )}

              {/* Completion chip */}
              {completed && status !== 'working' && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: '4px',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  background: 'rgba(74,222,128,0.1)',
                  border: '1px solid rgba(74,222,128,0.3)',
                  fontSize: '10px',
                  color: 'var(--accent-green)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  ✓ {completed.result.tokensUsed.toLocaleString()}tok
                  · ${completed.result.costUsd.toFixed(4)}
                  · {(completed.result.duration / 1000).toFixed(1)}s
                </div>
              )}
            </div>
          );
        })}

        {sorted.length === 0 && (
          <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
            No agents found. Check WORKSPACE_ROOT.
          </div>
        )}
      </div>

      {/* Right 2/3 — Log panel */}
      <div style={{ flex: 1, padding: '16px', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{
          fontSize: '13px',
          fontWeight: 600,
          color: 'var(--text-primary)',
          marginBottom: '12px',
        }}>
          {selectedAgentId ? `${selectedAgentId} — 실시간 출력` : '로그 패널'}
        </div>
        <div style={{ flex: 1, overflow: 'hidden' }}>
          <LogPanel
            agentId={selectedAgentId}
            chunks={selectedChunks}
            height="100%"
          />
        </div>
      </div>
    </div>
  );
}
