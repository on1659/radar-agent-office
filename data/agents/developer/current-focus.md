# 현재 집중 사항

## 스프린트 목표 (Meeting #26 이후)
- Character.ts fallback 구현 + L2 검증: 1) Character.ts에 getDefaultPixelData(agentId) 함수 추가 — 도윤 옵션 C 스펙(해시 기반 hue + 기본 실루엣) 2) PIXEL_DATA[agentId] ?? getDefaultPixelData(agentId) 패턴 적용 3) tsc --noEmit + npm run build 0 errors 확인 4) npm run dev → OfficePage /office 접근 → 콘솔 에러 확인 → L2 판정 보고. 완료 기준: fallback 구현 + 빌드 0 errors + L2 판정(에이전트 Canvas 표시 여부)