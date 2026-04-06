// Design Ref: §5.4 — Table-based agent list view
import type { Agent, AgentStatus } from '@radar/shared';
import { StatusBadge } from './StatusBadge';

interface Props {
  agents: Array<Agent & { status: AgentStatus }>;
  selectedAgentId?: string | null;
  onSelectAgent?: (agentId: string) => void;
}

export function AgentListView({ agents, selectedAgentId, onSelectAgent }: Props) {
  return (
    <table style={{
      width: '100%',
      borderCollapse: 'collapse',
      fontSize: '13px',
    }}>
      <thead>
        <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
          {['Status', 'Name', 'Department', 'Role', 'Model', 'Current Task'].map(h => (
            <th key={h} style={{
              textAlign: 'left',
              padding: '10px 12px',
              color: 'var(--text-muted)',
              fontWeight: 500,
              fontSize: '11px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {agents.map((agent) => (
          <tr
            key={agent.id}
            onClick={() => onSelectAgent?.(agent.id)}
            style={{
              borderBottom: '1px solid var(--border-color)',
              background: selectedAgentId === agent.id
                ? 'rgba(74,158,255,0.12)'
                : agent.status === 'working' ? 'rgba(74,158,255,0.05)' : 'transparent',
              cursor: onSelectAgent ? 'pointer' : 'default',
            }}
          >
            <td style={{ padding: '10px 12px' }}>
              <StatusBadge status={agent.status} />
            </td>
            <td style={{ padding: '10px 12px', fontWeight: 500 }}>{agent.name}</td>
            <td style={{ padding: '10px 12px', color: 'var(--text-secondary)' }}>{agent.department}</td>
            <td style={{ padding: '10px 12px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{agent.role}</td>
            <td style={{ padding: '10px 12px' }}>
              <span style={{
                background: agent.model === 'opus' ? 'var(--model-opus)' : agent.model === 'sonnet' ? 'var(--model-sonnet)' : 'var(--model-haiku)',
                color: '#000',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '11px',
                fontWeight: 600,
              }}>
                {agent.model}
              </span>
            </td>
            <td style={{ padding: '10px 12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              {agent.currentTask ?? '—'}
            </td>
          </tr>
        ))}
        {agents.length === 0 && (
          <tr>
            <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No agents found. Check WORKSPACE_ROOT configuration.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
