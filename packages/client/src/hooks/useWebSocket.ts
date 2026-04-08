import { useEffect, useRef, useCallback } from 'react';
import type { ServerEvent, ClientEvent } from '@radar/shared';
import { useAgentStore } from '../store/useAgentStore';
import { useWorkspaceStore } from '../store/useWorkspaceStore';
import { useMeetingStore } from '../store/useMeetingStore';

export function useWebSocket(token: string) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const heartbeatTimer = useRef<ReturnType<typeof setInterval>>(undefined);
  const retryCount = useRef(0);

  const setStatus = useAgentStore((s) => s.setStatus);
  const addActivity = useAgentStore((s) => s.addActivity);
  const appendChunk = useAgentStore((s) => s.appendChunk);
  const addCompletedResult = useAgentStore((s) => s.addCompletedResult);
  const addCompletedAgent  = useAgentStore((s) => s.addCompletedAgent);
  const setApprovalRequest = useAgentStore((s) => s.setApprovalRequest);
  const addTokenCost = useAgentStore((s) => s.addTokenCost);
  const setCurrentTask = useAgentStore((s) => s.setCurrentTask);
  const clearCurrentTask = useAgentStore((s) => s.clearCurrentTask);

  const fetchOverview = useWorkspaceStore((s) => s.fetchOverview);
  const updateMeetingStatus = useMeetingStore((s) => s.updateStatus);

  const connect = useCallback(() => {
    if (!token) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws?token=${token}`);
    wsRef.current = ws;

    ws.onopen = () => {
      retryCount.current = 0;
      // Heartbeat every 30s
      heartbeatTimer.current = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'ping' }));
        }
      }, 30000);
    };

    ws.onerror = () => {
      // Error is always followed by onclose, which handles reconnect
    };

    ws.onmessage = (e) => {
      try {
        const event: ServerEvent = JSON.parse(e.data);

        switch (event.type) {
          case 'statusUpdate':
            setStatus(event.agentId, event.status);
            break;

          case 'activityEvent':
            addActivity(event.entry);
            break;

          case 'agentStream':
            appendChunk(event.agentId, event.chunk);
            break;

          case 'agentDone':
            addCompletedResult(event.agentId, event.result);
            addCompletedAgent(event.agentId);
            addTokenCost(event.result.tokensUsed, event.result.costUsd);
            clearCurrentTask(event.agentId);
            break;

          case 'agentQueued':
            setCurrentTask(event.agentId, `Queued (#${event.position})`);
            break;

          case 'approvalRequest':
            setApprovalRequest({
              sessionId: event.sessionId,
              agentId: event.agentId,
              command: event.command,
              reason: event.reason,
            });
            break;

          case 'workspaceUpdate':
            fetchOverview();
            break;

          case 'meetingUpdate':
            updateMeetingStatus(event.meeting);
            break;
        }
      } catch { /* ignore malformed */ }
    };

    ws.onclose = () => {
      wsRef.current = null;
      clearInterval(heartbeatTimer.current);
      // Reconnect with backoff: 1→2→4→8→30s, max 5 retries
      if (retryCount.current < 5) {
        const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000);
        retryCount.current++;
        reconnectTimer.current = setTimeout(connect, delay);
      }
    };
  }, [token, setStatus, addActivity, appendChunk, addCompletedResult, addCompletedAgent, setApprovalRequest, addTokenCost, setCurrentTask, clearCurrentTask, fetchOverview, updateMeetingStatus]);

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      clearInterval(heartbeatTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  const send = useCallback((event: ClientEvent) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(event));
    }
  }, []);

  return { send };
}
