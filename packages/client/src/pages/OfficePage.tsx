// Design Ref: §5.4 — OfficePage with 2.5D office + list view toggle + LogPanel + SpeechBubbles
import { useRef, useEffect, useCallback, useMemo, useState } from 'react';
import { useGameEngine } from '../game/useGameEngine';
import { AgentListView } from '../components/AgentListView';
import { LogPanel } from '../components/LogPanel';
import { SpeechBubble } from '../components/SpeechBubble';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useAgentStore } from '../store/useAgentStore';
import type { AgentStatus } from '@radar/shared';

export function OfficePage() {
  const [view, setView] = useState<'office' | 'list'>('office');
  const containerRef = useRef<HTMLDivElement>(null);

  const wsAgents = useWorkspaceStore((s) => s.agents);
  const skills = useWorkspaceStore((s) => s.skills);
  const statuses = useAgentStore((s) => s.statuses);
  const chunks = useAgentStore((s) => s.chunks);
  const selectedAgentId = useAgentStore((s) => s.selectedAgentId);
  const setSelectedAgent = useAgentStore((s) => s.setSelectedAgent);
  const currentTasks = useAgentStore((s) => s.currentTasks);

  // Build agent status map — use skills as agents if no agents
  const agentStatuses = useMemo(() => {
    const map: Record<string, AgentStatus> = {};
    const sources = wsAgents.length > 0
      ? wsAgents.map(a => a.id)
      : skills.map(s => s.name);

    for (const id of sources) {
      map[id] = statuses[id] ?? 'idle';
    }

    // Ensure at least some demo agents if nothing loaded
    // IDs must match keys in pixel-data.ts so sprites render
    if (Object.keys(map).length === 0) {
      for (const id of ['jimin', 'hyunwoo', 'soyeon', 'taejun', 'mirae', 'yunso', 'daeun', 'seungho']) {
        map[id] = statuses[id] ?? 'idle';
      }
    }

    return map;
  }, [wsAgents, skills, statuses]);

  const agentIds = useMemo(() => Object.keys(agentStatuses), [agentStatuses]);

  const gameConfig = useMemo(() => ({ agentIds }), [agentIds]);

  // Auto-select first working agent for log viewing
  useEffect(() => {
    if (selectedAgentId && agentStatuses[selectedAgentId] === 'working') return;
    const workingId = agentIds.find((id) => agentStatuses[id] === 'working');
    if (workingId) setSelectedAgent(workingId);
  }, [agentIds, agentStatuses, selectedAgentId, setSelectedAgent]);

  const selectedChunks = selectedAgentId ? (chunks[selectedAgentId] ?? []) : [];
  const hasLogContent = selectedAgentId !== null;

  const {
    tileMapRef,
    characterRef,
    setViewportSize,
    engine,
    getAgentPixelPos,
    frameTick,
    getCameraOffset,
  } = useGameEngine(agentStatuses, gameConfig);

  // Build speech bubble positions for working agents
  const speechBubbles = useMemo(() => {
    const cam = getCameraOffset();
    const bubbles: Array<{ agentId: string; text: string; x: number; y: number }> = [];
    for (const id of agentIds) {
      if (agentStatuses[id] !== 'working') continue;
      const task = currentTasks[id];
      if (!task) continue;
      const pos = getAgentPixelPos(id);
      if (!pos) continue;
      bubbles.push({
        agentId: id,
        text: task,
        x: pos.x - cam.x,
        y: pos.y - cam.y - 28,
      });
    }
    return bubbles;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentIds, agentStatuses, currentTasks, frameTick, getAgentPixelPos, getCameraOffset]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) setViewportSize(width, height);
      }
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, [setViewportSize]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => { engine?.getCamera().onMouseDown(e.nativeEvent); }, [engine]);
  const handleMouseMove = useCallback((e: React.MouseEvent) => { engine?.getCamera().onMouseMove(e.nativeEvent); }, [engine]);
  const handleMouseUp = useCallback(() => { engine?.getCamera().onMouseUp(); }, [engine]);
  const handleWheel = useCallback((e: React.WheelEvent) => { engine?.getCamera().onWheel(e.nativeEvent); }, [engine]);

  // Build agent list for table view (with click handler)
  const agentList = useMemo(() => {
    return agentIds.map(id => ({
      id,
      name: id,
      department: 'dev' as const,
      model: 'sonnet' as const,
      role: '',
      status: agentStatuses[id],
      currentTask: currentTasks[id],
    }));
  }, [agentIds, agentStatuses, currentTasks]);

  // Calculate dynamic heights based on whether log panel is visible
  const mainHeight = hasLogContent ? 'calc(100vh - 380px)' : 'calc(100vh - 160px)';

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: 600 }}>에이전트 오피스</h2>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Agent selector for logs */}
          <select
            value={selectedAgentId ?? ''}
            onChange={(e) => setSelectedAgent(e.target.value || null)}
            style={{
              background: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-sm)',
              padding: '4px 8px',
              fontSize: '11px',
            }}
          >
            <option value="">로그 에이전트 선택...</option>
            {agentIds.map(id => (
              <option key={id} value={id}>
                {id} {agentStatuses[id] === 'working' ? '●' : ''}
              </option>
            ))}
          </select>

          {/* View toggle */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--bg-tertiary)', borderRadius: 'var(--radius-sm)', padding: '2px' }}>
            {(['office', 'list'] as const).map(v => (
              <button
                key={v}
                onClick={() => setView(v)}
                style={{
                  background: view === v ? 'var(--accent-blue)' : 'transparent',
                  color: view === v ? '#fff' : 'var(--text-muted)',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  padding: '4px 12px',
                  fontSize: '12px',
                  fontWeight: 500,
                  cursor: 'pointer',
                }}
              >
                {v === 'office' ? 'Office' : 'List'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {view === 'office' ? (
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border-color)',
            height: mainHeight,
            overflow: 'hidden',
            cursor: engine?.getCamera().isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
        >
          <canvas ref={tileMapRef} style={{ position: 'absolute', top: 0, left: 0 }} />
          <canvas ref={characterRef} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }} />
          {/* SpeechBubbles for working agents */}
          {speechBubbles.map((b) => (
            <SpeechBubble
              key={b.agentId}
              text={b.text}
              style={{ left: b.x, top: b.y, transform: 'translateX(-50%)' }}
            />
          ))}
        </div>
      ) : (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-lg)',
          overflow: 'auto',
          maxHeight: mainHeight,
        }}>
          <AgentListView
            agents={agentList}
            selectedAgentId={selectedAgentId}
            onSelectAgent={setSelectedAgent}
          />
        </div>
      )}

      {/* M8/M10: Live log panel */}
      {hasLogContent && (
        <div style={{ marginTop: '12px' }}>
          <LogPanel agentId={selectedAgentId} chunks={selectedChunks} />
        </div>
      )}
    </div>
  );
}
