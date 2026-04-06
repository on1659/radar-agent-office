// Design Ref: §4.3 — WebSocket Protocol type guards
import type { ClientEvent, ServerEvent } from '@radar/shared';

export function isClientEvent(data: unknown): data is ClientEvent {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.type !== 'string') return false;

  switch (obj.type) {
    case 'runAgent':
      return typeof obj.agentId === 'string' && typeof obj.prompt === 'string';
    case 'stopAgent':
      return typeof obj.agentId === 'string';
    case 'approvalResponse':
      return typeof obj.sessionId === 'string' && typeof obj.approved === 'boolean';
    default:
      return false;
  }
}

export function serializeEvent(event: ServerEvent): string {
  return JSON.stringify(event);
}
