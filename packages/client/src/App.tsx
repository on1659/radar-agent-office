// Design Ref: §5.2 — React Router SPA + auto token from localhost server
import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { DashboardShell } from './layouts/DashboardShell';
import { OverviewPage } from './pages/OverviewPage';
import { OfficePage } from './pages/OfficePage';
import { AgentsPage } from './pages/AgentsPage';
import { ActivityPage } from './pages/ActivityPage';
import { MeetingPage } from './pages/MeetingPage';
import { SettingsPage } from './pages/SettingsPage';
import { useWorkspaceStore } from './store/useWorkspaceStore';

export function App() {
  const setToken = useWorkspaceStore((s) => s.setToken);
  const token = useWorkspaceStore((s) => s.token);
  const fetchAll = useWorkspaceStore((s) => s.fetchAll);
  const [error, setError] = useState('');

  // Auto-fetch token from localhost server
  useEffect(() => {
    // Check localStorage first
    const saved = localStorage.getItem('radar_token');
    if (saved) {
      setToken(saved);
      return;
    }

    // Auto-fetch from /api/auth/token (localhost only)
    fetch('/api/auth/token')
      .then(r => {
        if (!r.ok) throw new Error(`${r.status}`);
        return r.json();
      })
      .then(data => {
        if (data.token) {
          localStorage.setItem('radar_token', data.token);
          setToken(data.token);
        }
      })
      .catch(() => {
        setError('Server not reachable. Run: npm run dev');
      });
  }, [setToken]);

  // Auto-load workspace data once token is available
  useEffect(() => {
    if (token) { fetchAll(); }
  }, [token, fetchAll]);

  // Loading / error state
  if (!token) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '100vh', background: 'var(--bg-primary)',
        flexDirection: 'column', gap: '16px',
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>
          RADAR
        </h1>
        {error ? (
          <p style={{ fontSize: '13px', color: 'var(--accent-red)' }}>{error}</p>
        ) : (
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Connecting to server...</p>
        )}
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<DashboardShell />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/office" element={<OfficePage />} />
          <Route path="/meeting" element={<MeetingPage />} />
          <Route path="/activity" element={<ActivityPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
