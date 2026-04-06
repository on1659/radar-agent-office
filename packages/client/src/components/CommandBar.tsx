// Design Ref: §5.3 — CommandBar (bottom-fixed, agent select + prompt + execute)
import { useState, useCallback } from 'react';
import type { Agent } from '@radar/shared';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { TokenBudgetBadge } from './TokenBudgetBadge';

interface Props {
  onRun: (agentId: string, prompt: string) => void;
  onStop: (agentId: string) => void;
  workingAgents: Set<string>;
  todayTokens?: number;
  todayCost?: number;
}

export function CommandBar({ onRun, onStop, workingAgents, todayTokens = 0, todayCost = 0 }: Props) {
  const agents = useWorkspaceStore((s) => s.agents);
  const skills = useWorkspaceStore((s) => s.skills);

  const [selectedAgent, setSelectedAgent] = useState('');
  const [prompt, setPrompt] = useState('');

  // Use skills as agents if no agents defined
  const agentOptions = agents.length > 0
    ? agents
    : skills.map(s => ({ id: s.name, name: s.name, model: 'sonnet' as const, department: 'dev' as const, role: s.description, status: 'idle' as const }));

  const isWorking = selectedAgent ? workingAgents.has(selectedAgent) : false;

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAgent || !prompt.trim()) return;
    if (isWorking) return;
    onRun(selectedAgent, prompt);
    setPrompt('');
  }, [selectedAgent, prompt, isWorking, onRun]);

  const handleStop = useCallback(() => {
    if (selectedAgent) onStop(selectedAgent);
  }, [selectedAgent, onStop]);

  return (
    <form onSubmit={handleSubmit} style={{
      height: 'var(--commandbar-height)',
      background: 'var(--bg-secondary)',
      borderTop: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: '10px',
    }}>
      {/* Agent selector */}
      <select
        value={selectedAgent}
        onChange={(e) => setSelectedAgent(e.target.value)}
        style={{
          background: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 10px',
          fontSize: '13px',
          minWidth: '160px',
        }}
      >
        <option value="">에이전트 선택...</option>
        {agentOptions.map((a) => (
          <option
            key={a.id}
            value={a.id}
            disabled={workingAgents.has(a.id)}
          >
            {a.name} ({a.model})
            {workingAgents.has(a.id) ? ' [작업 중]' : ''}
          </option>
        ))}
      </select>

      {/* Prompt input */}
      <input
        type="text"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="프롬프트 입력..."
        disabled={!selectedAgent || isWorking}
        style={{
          flex: 1,
          background: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-sm)',
          padding: '6px 12px',
          fontSize: '13px',
          fontFamily: 'var(--font-mono)',
        }}
      />

      {/* Run / Stop button */}
      {isWorking ? (
        <button
          type="button"
          onClick={handleStop}
          style={{
            background: 'var(--accent-red)',
            color: '#fff',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Stop
        </button>
      ) : (
        <button
          type="submit"
          disabled={!selectedAgent || !prompt.trim()}
          style={{
            background: selectedAgent && prompt.trim() ? 'var(--accent-blue)' : 'var(--bg-tertiary)',
            color: selectedAgent && prompt.trim() ? '#fff' : 'var(--text-muted)',
            border: 'none',
            borderRadius: 'var(--radius-sm)',
            padding: '6px 16px',
            fontSize: '13px',
            fontWeight: 600,
            cursor: selectedAgent && prompt.trim() ? 'pointer' : 'default',
          }}
        >
          Run
        </button>
      )}

      {/* Active jobs badge */}
      {workingAgents.size > 0 && (
        <span style={{
          background: 'var(--accent-blue)',
          color: '#fff',
          borderRadius: '10px',
          padding: '2px 8px',
          fontSize: '11px',
          fontWeight: 600,
        }}>
          {workingAgents.size}
        </span>
      )}

      {/* Token budget indicator */}
      {(todayTokens > 0 || todayCost > 0) && (
        <TokenBudgetBadge todayTokens={todayTokens} todayCost={todayCost} />
      )}
    </form>
  );
}
