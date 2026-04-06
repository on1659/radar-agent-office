# 현재 집중 사항

## 스프린트 목표 (Meeting #14 이후)
- STATUS_COLORS / DONE_CHIP_STYLE / LAYOUT 적용 + 빌드 재확인: 1) AgentStatus 타입 리터럴이 idle|working|error|queued와 일치하는지 확인 2) AgentsPage.tsx 상단에 도윤 제공 상수 3개 선언 3) 에이전트 카드에 STATUS_COLORS[status].bg/.fg 적용 4) 레이아웃에 LAYOUT.gap/listFlex/logFlex 적용 5) 완료 칩에 DONE_CHIP_STYLE 적용 (costUsd 옵셔널) 6) tsc --noEmit 전체 + npm run build 0 errors 확인. 완료 기준: 빌드 0 errors + 상태별 색상 표시 + 1/3:2/3 레이아웃 + 완료 칩 스타일