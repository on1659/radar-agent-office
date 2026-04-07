# 현재 집중 사항

## 스프린트 목표 (Meeting #15 이후)
- 완료 칩 버그 수정 + Empty State + fallback + 빌드: 1) useAgentStore에 completedAgents: Set<string> 추가 — agentDone 이벤트 수신 시 에이전트 ID를 Set에 추가 2) AgentsPage.tsx 완료 칩 조건을 agent.status==='done'에서 completedAgents.has(agent.id)로 변경 3) STATUS_COLORS[agent.status] 접근에 ?? STATUS_COLORS.idle fallback 추가 4) agents.length === 0일 때 Empty State 메시지 추가 5) error 상태 에이전트 선택 시 LogPanel에 기존 chunks 유지 확인 6) tsc --noEmit 전체 + npm run build 0 errors. 완료 기준: 빌드 0 errors + completedAgents 패턴 + fallback + Empty State + error LogPanel 확인