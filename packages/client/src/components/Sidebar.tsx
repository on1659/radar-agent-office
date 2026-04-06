// Design Ref: §5.2, §5.3 — Sidebar navigation
import { NavLink } from 'react-router-dom';

const navItems = [
  { path: '/',         label: '시스템 개요',    icon: '📊' },
  { path: '/office',   label: '에이전트 오피스', icon: '🏢' },
  { path: '/meeting',  label: '에이전트 회의',  icon: '🤝' },
  { path: '/activity', label: '활동 타임라인',  icon: '📋' },
  { path: '/settings', label: '설정',          icon: '⚙️' },
];

export function Sidebar() {
  return (
    <aside style={{
      width: 'var(--sidebar-width)',
      background: 'var(--bg-secondary)',
      borderRight: '1px solid var(--border-color)',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px 0',
      overflow: 'hidden',
    }}>
      {/* Logo */}
      <div style={{
        padding: '0 16px 20px',
        borderBottom: '1px solid var(--border-color)',
        marginBottom: '8px',
      }}>
        <h1 style={{
          fontSize: '16px',
          fontWeight: 700,
          color: 'var(--accent-blue)',
          fontFamily: 'var(--font-mono)',
        }}>
          RADAR
        </h1>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Agent Office v0.1
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '4px 8px' }}>
        {navItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)',
              background: isActive ? 'var(--bg-hover)' : 'transparent',
              textDecoration: 'none',
              fontSize: '13px',
              fontWeight: isActive ? 600 : 400,
              transition: 'all 0.15s',
              marginBottom: '2px',
            })}
          >
            <span style={{ fontSize: '16px' }}>{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Version */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border-color)',
        fontSize: '11px',
        color: 'var(--text-muted)',
      }}>
        Phase 0 Build
      </div>
    </aside>
  );
}
