// Design Ref: §5.4 — OverviewPage with stat cards
import { useEffect } from 'react';
import { useWorkspaceStore } from '../store/useWorkspaceStore';

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{
      background: 'var(--bg-secondary)',
      border: '1px solid var(--border-color)',
      borderRadius: 'var(--radius-md)',
      padding: '20px',
      flex: '1 1 150px',
    }}>
      <div style={{ fontSize: '28px', fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>
        {value}
      </div>
      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
        {label}
      </div>
    </div>
  );
}

export function OverviewPage() {
  const { overview, skills, hooks, rules, loading, fetchAll } = useWorkspaceStore();

  useEffect(() => { fetchAll(); }, [fetchAll]);

  if (loading) {
    return <div style={{ color: 'var(--text-muted)', padding: '40px' }}>Loading...</div>;
  }

  return (
    <div>
      <h2 style={{ fontSize: '20px', fontWeight: 600, marginBottom: '20px' }}>
        시스템 개요
      </h2>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginBottom: '24px' }}>
        <StatCard label="Agents" value={overview?.agents ?? 0} color="var(--accent-blue)" />
        <StatCard label="Skills" value={overview?.skills ?? 0} color="var(--accent-green)" />
        <StatCard label="Hooks" value={overview?.hooks ?? 0} color="var(--accent-amber)" />
        <StatCard label="Rules" value={overview?.rules ?? 0} color="var(--accent-purple)" />
        <StatCard label="Active Jobs" value={overview?.activeJobs ?? 0} color="var(--accent-red)" />
        <StatCard label="Total" value={overview?.total ?? 0} color="var(--text-primary)" />
      </div>

      {/* Model distribution */}
      {overview?.modelDistribution && Object.keys(overview.modelDistribution).length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
          marginBottom: '24px',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>Model Distribution</h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            {Object.entries(overview.modelDistribution).map(([model, count]) => (
              <div key={model} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: 12, height: 12, borderRadius: '3px',
                  background: model === 'opus' ? 'var(--model-opus)' : model === 'sonnet' ? 'var(--model-sonnet)' : 'var(--model-haiku)',
                }} />
                <span style={{ fontSize: '13px' }}>{model}: {count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Skills list */}
      {skills.length > 0 && (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: 'var(--radius-md)',
          padding: '20px',
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
            Skills ({skills.length})
          </h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {skills.map((s) => (
              <span key={s.name} style={{
                background: 'var(--bg-tertiary)',
                borderRadius: 'var(--radius-sm)',
                padding: '4px 10px',
                fontSize: '12px',
                color: 'var(--text-secondary)',
              }}>
                {s.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
