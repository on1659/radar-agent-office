// Design Ref: §5.1 — CSS Grid layout (sidebar + main + commandbar)
import { Outlet } from 'react-router-dom';
import { useCallback, useMemo } from 'react';
import { Sidebar } from '../components/Sidebar';
import { CommandBar } from '../components/CommandBar';
import { ApprovalModal } from '../components/ApprovalModal';
import { CompletionToast } from '../components/CompletionToast';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useAgentStore } from '../store/useAgentStore';
import { useWebSocket } from '../hooks/useWebSocket';

export function DashboardShell() {
  const token = useWorkspaceStore((s) => s.token);
  const { send } = useWebSocket(token);

  const statuses = useAgentStore((s) => s.statuses);
  const approvalRequest = useAgentStore((s) => s.approvalRequest);
  const setApprovalRequest = useAgentStore((s) => s.setApprovalRequest);
  const completedResults = useAgentStore((s) => s.completedResults);
  const dismissResult = useAgentStore((s) => s.dismissResult);
  const clearChunks = useAgentStore((s) => s.clearChunks);
  const todayTokens = useAgentStore((s) => s.todayTokens);
  const todayCost = useAgentStore((s) => s.todayCost);

  const workingAgents = useMemo(() => {
    const set = new Set<string>();
    for (const [id, status] of Object.entries(statuses)) {
      if (status === 'working' || status === 'queued') set.add(id);
    }
    return set;
  }, [statuses]);

  const setCurrentTask = useAgentStore((s) => s.setCurrentTask);

  const handleRun = useCallback((agentId: string, prompt: string) => {
    // Clear previous chunks when starting new run
    clearChunks(agentId);
    // Set current task description for speech bubbles
    setCurrentTask(agentId, prompt.length > 60 ? prompt.slice(0, 57) + '...' : prompt);

    // REST API for persistence
    fetch('/api/agent/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ agentId, prompt }),
    }).catch(() => {});

    send({ type: 'runAgent', agentId, prompt });
  }, [token, send, clearChunks, setCurrentTask]);

  const handleStop = useCallback((agentId: string) => {
    fetch('/api/agent/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ agentId }),
    }).catch(() => {});

    send({ type: 'stopAgent', agentId });
  }, [token, send]);

  // M10: Approval flow
  const handleApprove = useCallback(() => {
    if (!approvalRequest) return;
    send({ type: 'approvalResponse', sessionId: approvalRequest.sessionId, approved: true });
    setApprovalRequest(null);
  }, [approvalRequest, send, setApprovalRequest]);

  const handleReject = useCallback(() => {
    if (!approvalRequest) return;
    send({ type: 'approvalResponse', sessionId: approvalRequest.sessionId, approved: false });
    setApprovalRequest(null);
  }, [approvalRequest, send, setApprovalRequest]);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'var(--sidebar-width) 1fr',
      gridTemplateRows: '1fr var(--commandbar-height)',
      height: '100vh',
      overflow: 'hidden',
    }}>
      {/* Sidebar */}
      <div style={{ gridRow: '1 / -1' }}>
        <Sidebar />
      </div>

      {/* Main content */}
      <main style={{
        overflow: 'auto',
        padding: '24px',
        background: 'var(--bg-primary)',
      }}>
        <Outlet />
      </main>

      {/* CommandBar with token badge */}
      <CommandBar
        onRun={handleRun}
        onStop={handleStop}
        workingAgents={workingAgents}
        todayTokens={todayTokens}
        todayCost={todayCost}
      />

      {/* M10: Approval modal overlay */}
      {approvalRequest && (
        <ApprovalModal
          agentId={approvalRequest.agentId}
          command={approvalRequest.command}
          reason={approvalRequest.reason}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      {/* M10: Completion toasts (bottom-right stack) */}
      {completedResults.length > 0 && (
        <div style={{
          position: 'fixed',
          bottom: '70px',
          right: '16px',
          display: 'flex',
          flexDirection: 'column-reverse',
          gap: '8px',
          zIndex: 900,
        }}>
          {completedResults.slice(-3).map((cr) => (
            <CompletionToast
              key={cr.agentId + '-' + cr.result.duration}
              agentId={cr.agentId}
              result={cr.result}
              onDismiss={() => dismissResult(cr.agentId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
