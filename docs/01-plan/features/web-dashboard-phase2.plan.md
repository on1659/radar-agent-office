# Radar Agent Office — Web Dashboard Phase 2 Planning Document

> **Summary**: Phase 1 MVP(AgentsPage 에이전트 목록 + 실행 + 스트리밍) 완료 이후, OfficePage Canvas 뷰 도입 + 이중 뷰 토글 + 접근성 기반을 구축하는 Phase 2 계획
>
> **Project**: radar-agent-office
> **Version**: 0.1.0 (Draft)
> **Author**: Ha-eun (planner)
> **Date**: 2026-04-09
> **Status**: Draft — 다음 회의 리뷰 후 확정
> **Previous Phase**: [web-dashboard.plan.md](web-dashboard.plan.md) (Phase 1 완료, Match Rate 92%)

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | Phase 1은 리스트 뷰(AgentsPage)만 존재 — 멀티에이전트 공간감이 없음. 색상 기반 상태 구분만으로는 색각 이상 사용자 대응 불가 |
| **Solution** | 2.5D 픽셀아트 OfficePage Canvas 기본 렌더링 + 리스트 뷰 토글 + 접근성(아이콘/레이블/ARIA) 추가 |
| **Function/UX Effect** | "지금 어떤 에이전트가 무엇을 하는지"를 공간 위치로 직관적으로 파악. 색각 이상 포함 모든 사용자가 상태 구분 가능 |
| **Core Value** | "AI 팀의 가상 오피스 — 지도처럼 보이는 에이전트 현황" |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | Phase 1 리스트 뷰로 에이전트 상태 확인 가능해졌지만, 오피스 시각화는 Phase 1에서 제외됨 (Meeting #8 결정) |
| **PREREQUISITE** | Phase 1 완료 (AgentsPage WS 연결 + 실시간 상태 갱신 검증 완료) |
| **DEFERRED FROM** | OfficePage: Phase 1 Section 10.6 Out of Scope. 접근성: Phase 1 Gap analysis 이관 항목 |
| **RISK** | Canvas 접근성 구현이 게임엔진 내부 구조에 의존 — 설계 검토 필요 (Section 6 참조) |
| **SUCCESS** | OfficePage 기본 렌더링 60fps + 이중 뷰 전환 + 접근성 성공 기준 항목 충족 |

---

## 1. Overview

### 1.1 Purpose

Phase 1에서 확립된 에이전트 상태 관리(WS 기반 실시간 갱신)를 토대로, OfficePage 2.5D Canvas 뷰를 추가하고, AgentsPage 리스트 뷰와 토글 전환이 가능한 이중 뷰 구조를 완성한다. 동시에 Phase 1에서 이관된 접근성 항목(색각 이상 사용자 대응)을 정식 구현한다.

### 1.2 Phase 경계

Phase 2는 **두 단계**로 나뉜다:

| 단계 | 범위 | 이유 |
|------|------|------|
| **Phase 2.0** | OfficePage 기본 렌더링 + 이중 뷰 + 접근성 | 게임엔진 이식 검증 + 접근성 기반 확립이 선행 필요 |
| **Phase 2.5** | 사용 통계(recharts) + 프로젝트 보드(칸반) | 데이터 축적 필요 + 별도 라이브러리 도입 + 별도 설계 |

Phase 2.0 완료 조건을 충족한 후 Phase 2.5 착수 여부를 결정한다.

---

## 2. Scope

### 2.1 Phase 2.0 — In Scope (핵심 3기능)

> **⚠️ 0.4 업데이트 (Meeting #25 코드 확인)**: FR-P2-01과 FR-P2-02는 이미 구현 완료 상태입니다.
> `/office` 라우트(App.tsx:79), OfficePage.tsx 227줄(Canvas 2개 + 이중 뷰 토글 + useAgentStore 연결), useGameEngine 브릿지 전부 존재.
> Phase 2.0 실제 작업은 **Gap Analysis + 접근성(FR-P2-03)만** 남아 있습니다.

| # | Feature | FR ID | 설명 | 구현 상태 |
|---|---------|-------|------|---------|
| 1 | **OfficePage 기본 렌더링** | FR-P2-01 | 2.5D 아이소메트릭 Canvas, 부서별 캐릭터 배치, 에이전트 실시간 상태 반영 | **구현 완료** — Gap Analysis 필요 |
| 2 | **이중 뷰 토글** | FR-P2-02 | OfficePage(Canvas) ↔ 리스트 뷰 전환, 동일 WS 데이터 소스 공유, 전환 시 데이터 일관성 | **구현 완료** — Gap Analysis 필요 |
| 3 | **접근성 기반** | FR-P2-03 | StatusBadge ARIA(`role="status"` + `aria-label`), `prefers-reduced-motion` 대응, Canvas 접근성 전략 C+B 구현 | **미구현** — 이번 Phase 핵심 작업 |

> **참고**: Phase 1.5 항목(온보딩, 활동 타임라인, 승인 모달, 설정 페이지)은 Phase 2.0과 별도로 진행 가능. 우선순위는 다음 회의에서 결정.

### 2.2 Phase 2.5 Backlog

원래 `web-dashboard.plan.md`의 Phase 2 범위(FR-07, FR-09)를 Phase 2.5로 이관 정리.

| FR ID | Feature | 이관 이유 | 사전 조건 |
|-------|---------|----------|----------|
| FR-07 | 사용 통계 대시보드 (도구 순위 / 일별 활동 / 토큰 소비 차트) | `recharts` 라이브러리 도입 + 데이터 축적 필요. Phase 1 SQLite에 쌓이는 중 | Phase 2.0 완료 + 최소 1주일 운영 데이터 |
| FR-09 | 프로젝트 관리 보드 (칸반 스타일) | 칸반 UI 별도 설계 필요. 에이전트 자동 할당 로직 복잡성 높음 | FR-07 완료 후 착수 검토 |
| FR-12 | 모드 전환 (개발자 모드 / 간편 모드 토글) | 사용자 피드백 수집 후 니즈 확인 필요 | 외부 피드백 수집 후 재결정 |

### 2.3 Out of Scope (Phase 2 전체)

| 항목 | 이동 Phase | 이유 |
|------|-----------|------|
| 파이프라인 시각화 (`@xyflow/react`) | Phase 3 | 별도 라이브러리 + 별도 설계. 에이전트 체인 데이터 구조 미정 |
| 에이전트 맵 / 아키텍처 뷰 | Phase 3 | Phase 3 고급 기능 |
| 카탈로그 (스킬/훅/규칙 검색) | Phase 3 | 검색 UX + 장착 로직 설계 별도 필요 |
| 멀티유저/팀 기능 | Phase 4+ | 로컬 도구 한계 벗어남 |
| 모바일 반응형 | 미정 | 데스크톱 우선 원칙 유지 |

---

## 3. Requirements

### 3.1 Functional Requirements (Phase 2.0)

| ID | Requirement | Priority | Component |
|----|-------------|----------|-----------|
| FR-P2-01 | OfficePage: 2.5D 아이소메트릭 Canvas 렌더링 (20×14 타일맵, 부서별 캐릭터 배치) | High | `OfficePage.tsx`, `GameEngine.ts` |
| FR-P2-01a | OfficePage: 에이전트 실시간 상태(idle/working/error/queued) → 캐릭터 애니메이션/말풍선 반영 | High | `Character.ts`, `useAgentStore` |
| FR-P2-01b | OfficePage: 비활성 탭 시 requestAnimationFrame 정지 (성능 최적화) | Medium | `GameEngine.ts` |
| FR-P2-02 | 이중 뷰: `/office` 라우트에서 Canvas 뷰 ↔ 리스트 뷰 토글 버튼 | High | `OfficePage.tsx`, `AgentListView.tsx` |
| FR-P2-02a | 이중 뷰: 뷰 전환 시 선택 에이전트 + LogPanel 상태 유지 (데이터 일관성) | High | `useAgentStore` |
| FR-P2-03 | 접근성: StatusBadge 상태별 텍스트 레이블 정렬 확인 — 색상+텍스트 병행으로 색각 이상 대응 (아이콘 추가 불필요) | High | `StatusBadge.tsx` |
| FR-P2-03a | 접근성: `role="status"` + `aria-label={status}` 추가 (스크린리더 대응) | High | `StatusBadge.tsx` |
| FR-P2-03b | 접근성: `prefers-reduced-motion` 감지 시 펄싱 애니메이션 정지 | High | `StatusBadge.tsx` |
| FR-P2-03c | 접근성: Canvas OfficePage 접근성 전략 구현 (Section 6 결정 후) | Medium | `OfficePage.tsx` |

### 3.2 Non-Functional Requirements

#### 접근성 (신규 — Phase 2.0 정식 포함)

> **결정 기반**: Meeting #22 execution에서 도윤 검토 결과, 8px 유니코드 아이콘은 가독성 불충분 — 기존 텍스트 레이블로 색각 이상 대응 충분. NFR을 2개로 축소.

| 기준 | 설명 | 측정 방법 |
|------|------|----------|
| **prefers-reduced-motion** | `@media (prefers-reduced-motion: reduce)` 시 펄싱 애니메이션(`@keyframes radar-pulse`) 정지 | OS 설정 변경 후 StatusBadge 애니메이션 정지 확인 |
| **Canvas 접근성** | OfficePage Canvas에 `role="img"` + `aria-label` + `aria-live` 영역 배치 (Section 6 전략 결정 후 구현) | 브라우저 Accessibility Inspector — Canvas 역할 및 상태 변화 알림 확인 |

#### 성능

| 기준 | 설명 | 측정 방법 |
|------|------|----------|
| **Canvas 60fps** | OfficePage `requestAnimationFrame` 루프 60fps 유지 (20×14 타일맵 + 최대 50 캐릭터) | Chrome DevTools Performance 패널 |
| **비활성 탭 최적화** | 탭 비활성화 시 rAF 정지 → CPU 0% 목표 | 비활성 탭에서 CPU 모니터링 |
| **뷰 전환 지연** | OfficePage ↔ 리스트 뷰 전환 시 UI 즉시 반응 (사용자 지연 없음) | 시각 확인 |

---

## 4. Success Criteria

### 4.1 Phase 2.0 Definition of Done

#### Feature 1 — OfficePage 기본 렌더링 (FR-P2-01)

> **구현 완료 (Meeting #25 확인)** — OfficePage.tsx 227줄. Gap Analysis로 설계 일치 여부 검증 필요.

- [x] `/office` 라우트 접속 — App.tsx:79
- [x] Canvas 렌더링 — tileMapRef + characterRef Canvas 2개
- [x] 에이전트 부서별 배치 — useGameEngine + agentStatuses 연결
- [x] WS 상태 즉시 반영 — useAgentStore 구독 + speech bubbles
- [x] 빌드 0 errors — Phase 1 완료 시점 통과
- [ ] **Gap Analysis 통과** — `/pdca analyze web-dashboard-phase2` ≥ 90%

#### Feature 2 — 이중 뷰 토글 (FR-P2-02)

> **구현 완료 (Meeting #25 확인)** — OfficePage.tsx:12 `useState<'office'|'list'>`. Gap Analysis 필요.

- [x] Office / List 전환 버튼 — OfficePage.tsx:153-172
- [x] 전환 시 같은 agentStatuses 데이터 공유 — useAgentStore 단일 소스
- [x] 선택 에이전트(`selectedAgentId`) 유지 — Zustand store
- [x] 전환 즉시 완료 — React state toggle
- [ ] **Gap Analysis 통과** — `/pdca analyze web-dashboard-phase2` ≥ 90%

#### Feature 3 — 접근성 기반 (FR-P2-03)

- [ ] `StatusBadge`: 각 상태(idle/working/error/queued)에 색상 + 텍스트 레이블 병행 표시 확인 (아이콘 추가 불필요 — 기존 레이블로 색각 이상 대응 충분)
- [ ] `StatusBadge`에 `role="status"` + `aria-label={status}` 포함 — 스크린리더에서 상태 읽힘
- [ ] `@media (prefers-reduced-motion: reduce)` 적용 시 `@keyframes radar-pulse` 정지
- [ ] OfficePage Canvas: `role="img"` + `aria-label` + `aria-live` 영역 — Section 6 전략 결정 후 구현

### 4.2 Quality Criteria (공통)

- [ ] TypeScript strict mode, `any` 사용 없음
- [ ] 빌드 0 errors (`tsc --noEmit` 3 패키지 모두 통과)
- [ ] 새 warning 추가 없음
- [ ] 기존 AgentsPage 기능 회귀 없음 (이중 뷰 도입 후에도 AgentsPage 독립 동작)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **게임엔진 이식 복잡성** — `GameEngine.ts`가 VS Code webview API에 의존하는 잔재가 있을 수 있음 | ~~High~~ **Closed** | ~~Medium~~ **N/A** | **사전 검토 완료 (Meeting #23)**: `GameEngine.ts` import 전수 확인 결과 VS Code 의존성 없음. `@radar/shared` 타입만 사용. 이식 준비 완료 상태. |
| **Canvas 접근성 구현 한계** — Canvas DOM 요소는 ARIA 지원이 제한적. 에이전트 캐릭터에 직접 `aria-label` 부여 불가 | High | High | Canvas 위에 hidden DOM 오버레이 전략 + 별도 설계 안건으로 등록 (Section 6 참조) |
| **이중 뷰 상태 동기화** — OfficePage와 AgentsPage가 같은 `useAgentStore`를 공유하지 않으면 데이터 불일치 | Medium | Low | `useAgentStore` 단일 소스로 두 뷰가 공유하도록 설계. 뷰 전환 시 re-subscribe 없음 확인 |
| **React→Canvas 브릿지 동기화** — `useAgentStore`(Zustand/React 상태)와 `GameEngine`(Canvas rAF 루프)는 업데이트 사이클이 다름 | ~~Medium~~ **Low** | ~~Medium~~ **Low** | **브릿지 이미 구현 완료 (Meeting #23 확인)**: `useGameEngine` 훅이 `agentStatuses: Record<string, AgentStatus>`를 받아 `useEffect`에서 `engine.updateAllAgentStatuses()` 호출. 단방향 브릿지 패턴 완성. `GameEngine.updateAgentStatus()` / `updateAllAgentStatuses()` public API 존재. OfficePage는 이 훅을 사용하면 됨. |
| **60fps 성능 저하** — 에이전트 수 증가 + 실시간 상태 갱신이 동시에 발생할 때 프레임 드롭 | Medium | Medium | Character 렌더링 dirty flag 패턴 — 상태 변경 시만 canvas 재그리기. baseline 측정 후 최적화 |
| **recharts 도입 시점** — Phase 2.5 착수 전 충분한 운영 데이터가 없을 수 있음 | Low | Medium | Phase 2.0 완료 후 SQLite 데이터 양 확인. 최소 7일치 데이터 확보 후 Phase 2.5 착수 |

---

## 6. Canvas 접근성 — 설계 안건

> **이 섹션은 설계 미결 항목입니다.** Phase 2.0 Design 문서 작성 시 결정이 필요합니다.

### 6.1 문제 정의

HTML `<canvas>` 요소는 DOM 트리에서 불투명한 픽셀 버퍼입니다. Canvas 내부에 그린 에이전트 캐릭터에 직접 `aria-label`, `role`, `tabindex`를 부여할 수 없습니다.

```
<canvas>   ← ARIA 접근 불가 (픽셀만 있음)
  [캐릭터 스프라이트들]  ← DOM 노드 없음
</canvas>
```

### 6.2 해결 전략 후보

| 전략 | 방법 | 장점 | 단점 |
|------|------|------|------|
| **A. Hidden DOM 오버레이** | Canvas 위에 position:absolute div 배치. 각 에이전트 위치에 화면엔 안 보이는 `<button aria-label="...">`를 배치 | 스크린리더 완전 지원, 키보드 포커스 가능 | 에이전트 위치 추적 로직 필요. Canvas 위치와 DOM 위치 동기화 복잡 |
| **B. aria-describedby + 범례** | Canvas 외부에 에이전트 상태 목록 DOM 테이블 배치. `<canvas aria-describedby="agent-status-list">` | 구현 단순 | Canvas 자체는 내비게이션 불가. 리스트 뷰와 중복 |
| **C. 리스트 뷰 우선** | OfficePage Canvas는 장식용(role="img"). 접근성 필요 시 이중 뷰 토글로 AgentsPage(리스트 뷰) 사용 권장 | 구현 없음 | 색각 이상 사용자에게 "다른 뷰로 가세요" 안내 필요 |

### 6.3 전략 확정 (Meeting #25 PD 결정)

**전략 C + B 혼합 채택** — 구현 복잡도와 접근성 수준의 균형.

전략 A(hidden overlay)는 Canvas 위 에이전트 픽셀 위치를 DOM에 동기화해야 하므로 구현 복잡도가 과도합니다. 이중 뷰(AgentsPage)가 이미 완전한 접근 가능 리스트 뷰로 존재하므로, Canvas는 시각적 보조 뷰로 포지셔닝하는 것이 타당합니다.

**구현 사항:**
- `<canvas ref={tileMapRef}>` 래퍼 div에 `role="img"` + `aria-label="에이전트 오피스 — 실시간 작업 현황"`
- Canvas 컨테이너 외부에 `aria-live="polite"` 영역 — 에이전트 상태 변화 시 텍스트 알림
  - 예: `{workingAgent} is now working`, `{errorAgent} has errored`
- `prefers-reduced-motion` 시 rAF 루프 정지 → 정적 스냅샷 유지
- 키보드 사용자에게 이중 뷰 List 버튼 포커스 안내

### 6.4 Canvas 외부 접근성 (즉시 적용 가능)

Canvas 접근성과 별개로 이중 뷰 전환 버튼, 에이전트 리스트(AgentsPage), StatusBadge는 즉시 접근성 개선 가능:

```tsx
// StatusBadge 개선 예시 (Phase 2.0 FR-P2-03)
// 아이콘 추가 불필요 — 기존 텍스트 레이블 + ARIA role 추가로 충분
<span
  role="status"
  aria-label={`Agent status: ${status}`}
  style={STATUS_COLORS[status] ?? STATUS_COLORS.idle}
>
  {STATUS_LABELS[status]}  {/* 텍스트 레이블: idle / working / error / queued */}
</span>
```

> **결정 근거**: Meeting #22 execution에서 도윤이 8px 유니코드 아이콘(○/▶/✕/⏳)을 검토한 결과, StatusBadge 컨텍스트에서 가독성 불충분. 기존 텍스트 레이블이 이미 색각 이상 대응 기능을 수행하므로 별도 아이콘 추가 불필요.

---

## 7. Timeline (tentative)

> **Phase 1.5 흡수 결정 (Meeting #22)**: Phase 1.5 독립 단계를 Phase 2에 흡수. 접근성은 Phase 2.0 비기능 요구사항으로 정식 포함. optional chaining은 Phase 1 마감 커밋에 포함하여 해소.

| Phase | Period | Core Deliverable | Exit Condition |
|-------|--------|------------------|----------------|
| **Phase 2.0** | W9–W10 (2주) | OfficePage 기본 + 이중 뷰 + 접근성(reduced-motion + Canvas) | Section 4.1 DoD 전 항목 충족 |
| **Phase 2.5** | W11–W12 (2주) | 사용 통계 + 프로젝트 보드 (조건부) | Phase 2.0 완료 + 운영 데이터 확보 |

---

## 8. Next Steps

1. [x] ~~**이 문서 리뷰**~~ — **완료 (Meeting #25)**: PD가 직접 코드 확인 후 범위 재조정. FR-P2-01/02 구현 완료 상태 반영.
2. [x] ~~**Phase 1.5 우선순위 결정**~~ — Phase 2에 흡수 완료 (Meeting #22 결정)
3. [x] ~~**Canvas 접근성 전략 결정**~~ — **완료 (Meeting #25)**: C+B 혼합 채택 확정. Section 6.3 업데이트.
4. [x] ~~**GameEngine.ts VS Code 의존성 감사**~~ — **완료 (Meeting #23)**: 의존성 없음.
5. [x] ~~**React→Canvas 브릿지 설계**~~ — **완료**: `useGameEngine` 이미 구현.
6. [ ] **OfficePage Gap Analysis** — `/pdca analyze web-dashboard-phase2` 실행 (Meeting #26)
7. [ ] **FR-P2-03 접근성 구현** — StatusBadge ARIA + prefers-reduced-motion + Canvas aria-live (Meeting #26 킥오프 후)
8. [ ] **Phase 2.0 Design 문서 작성** — Plan 확정 후 `/pdca design web-dashboard-phase2`

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-09 | 초안. Phase 2.0 핵심 3기능(OfficePage + 이중 뷰 + 접근성) 범위 초안. Phase 2.5 백로그 정리. Canvas 접근성 설계 안건 등록 | Ha-eun (planner) |
| 0.2 | 2026-04-09 | Meeting #22 execution 반영. (1) 접근성 방향 조정: 아이콘 불필요 → 텍스트 레이블 유지 (도윤 8px 가독성 검토 결과) (2) NFR 4개→2개 축소: reduced-motion + Canvas 접근성 (3) Section 5 React→Canvas 브릿지 리스크 추가 (4) Phase 1.5 독립 단계 제거 → Phase 2 흡수 반영 (5) Section 6.4 아이콘 코드 예시 → 텍스트 레이블 ARIA 예시로 교체 | Ha-eun (planner) |
| 0.3 | 2026-04-09 | Meeting #23 사전 확인 결과 반영. (1) Section 5 '게임엔진 이식 복잡성' 리스크 Close — VS Code 의존성 없음 확인 (2) Section 5 'React→Canvas 브릿지' 리스크 Low로 하향 — `useGameEngine` + `updateAllAgentStatuses()` 브릿지 이미 구현 완료 확인 (3) Section 8 Next Steps 2개 항목 완료 표시 (Phase 1.5 흡수, 게임엔진 감사) + React→Canvas 브릿지 설계 항목 추가 후 즉시 완료 표시 | Ha-eun (planner) |
| 0.4 | 2026-04-09 | Meeting #25 PD 코드 확인 결과 반영 (OfficePage.tsx + App.tsx 직접 확인). (1) Section 2.1: FR-P2-01/FR-P2-02 "구현 완료" 상태로 업데이트, 구현 상태 컬럼 추가 (2) Section 4.1: Feature 1/2 DoD 체크박스를 실제 구현 증거 기반으로 업데이트 — Gap Analysis 통과를 최종 기준으로 변경 (3) Section 6.3: Canvas 접근성 전략 확정 — C+B 혼합 채택, 전략 A(hidden overlay) 복잡도 과도로 기각 | Min-jun (PD) |
