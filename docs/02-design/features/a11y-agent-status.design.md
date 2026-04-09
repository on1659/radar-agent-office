# 접근성 스펙 — 에이전트 상태 표시 (Phase 1.5)

> **작성자**: 도윤 (UI/UX Designer)
> **작성일**: 2026-04-09
> **대상**: AgentsPage, StatusBadge, OfficePage (Canvas)
> **우선순위**: Phase 1.5 백로그 1번

---

## 1. 배경 및 문제 정의

Phase 1에서 에이전트 상태(idle/working/error/queued)는 **색상 + 위치(정렬)** 로 구분된다.

| 상태 | 색상 | 위치 |
|------|------|------|
| working | `#4a9eff` (파란색) | 최상단 고정 |
| queued | `#fbbf24` (노란색) | 두 번째 |
| idle | `#606070` (회색) | 하단 |
| error | `#f87171` (빨간색) | 최하단 |

색각 이상(색맹/색약) 사용자는 `working`(파랑)과 `idle`(회색) 구분이 어려울 수 있고,
`working`(파랑)과 `queued`(노랑) 중 파랑 계열 인식이 어려운 경우도 있다.

---

## 2. 현재 상태 분석

### 2.1 StatusBadge — 이미 텍스트 레이블 포함

`StatusBadge.tsx`의 `STYLE` 객체:

```typescript
const STYLE: Record<AgentStatus, { bg: string; label: string }> = {
  idle:    { bg: 'var(--status-idle)',    label: 'Idle' },
  working: { bg: 'var(--status-working)', label: 'Working' },
  error:   { bg: 'var(--status-error)',   label: 'Error' },
  queued:  { bg: 'var(--status-queued)',  label: 'Queued' },
};
```

렌더링: `8px 원형 점 + {s.label}` — 텍스트 레이블이 이미 출력되고 있다.

**결론**: 색각 이상 사용자도 현재 "Idle"/"Working"/"Error"/"Queued" 텍스트로 상태를 구분할 수 있다.
Phase 1.5 접근성 작업의 목표는 "추가 보완"이지 "기초 구현"이 아니다.

---

## 3. 아이콘 방안 — 8px 가독성 판단

### 3.1 제안 아이콘

| 상태 | 아이콘 | 유니코드 |
|------|--------|----------|
| idle | ○ | U+25CB WHITE CIRCLE |
| working | ▶ | U+25B6 BLACK RIGHT-POINTING TRIANGLE |
| error | ✕ | U+2715 MULTIPLICATION X |
| queued | ⏳ | U+231B HOURGLASS |

### 3.2 8px 기준 가독성 판단

현재 StatusBadge의 원형 점은 `width: 8px, height: 8px`이다. 이 크기에 유니코드 아이콘을 텍스트로 렌더링하는 경우:

| 아이콘 | 8px 판단 | 12px 판단 | 비고 |
|--------|---------|---------|------|
| ○ (원 외곽선) | ⚠️ 식별 어려움 | ✅ 가능 | 단순하지만 크기에 민감 |
| ▶ (삼각형) | ❌ 불명확 | ✅ 가능 | 획이 가늘면 8px에서 blur |
| ✕ (X) | ❌ 불명확 | ✅ 가능 | 선 교차점이 8px에서 뭉침 |
| ⏳ (모래시계) | ❌ 식별 불가 | ⚠️ 식별 어려움 | 복잡한 이모지는 16px+ 권장 |

**판단**: 8px 크기에 유니코드 아이콘 텍스트를 직접 사용하는 방식은 **부적합**.

### 3.3 권장 방향

현재 StatusBadge는 이미 텍스트 레이블("Idle"/"Working")을 출력한다. 아이콘 추가보다 다음 방식이 더 실용적이다:

**Option A — 텍스트 레이블 강화 (최소 변경)**
- 현재 `{s.label}` 텍스트를 그대로 유지
- 상태별 레이블을 더 명확하게: "Idle" → "대기", "Working" → "실행 중" 등 (KO/EN 선택)
- 추가 작업 없음. 현재 코드로 이미 요구사항 충족.

**Option B — 아이콘 + 레이블 조합 (12px 아이콘)**
- 8px 원형 점 유지 + 별도 `<span style={{ fontSize: '12px' }}>` 아이콘 추가
- 원형 점 대신 아이콘을 사용하면 원형 점 제거하고 12px 아이콘으로 교체
- 구현 비용: StatusBadge.tsx 수정 1곳

```tsx
// Option B 예시 구조
const ICON: Record<AgentStatus, string> = {
  idle:    '○',
  working: '▶',
  error:   '✕',
  queued:  '◷',  // ⏳ 대신 단순한 시계 아이콘
};

// 12px span으로 렌더링
<span style={{ fontSize: '12px', lineHeight: 1 }}>{ICON[status]}</span>
```

**권장: Option A.** StatusBadge에 이미 텍스트 레이블이 있으므로 추가 아이콘은 중복이다.
Phase 1.5에서 아이콘을 추가할 경우 8px 점을 **아이콘으로 교체**하되 12px 이상에서 렌더링.

---

## 4. Canvas (OfficePage) 접근성 옵션 분석

OfficePage는 Phase 1 제외 항목으로, Phase 2 이후에 에이전트 상태와 연결 예정이다.
Canvas 렌더링에서 색각 이상 사용자 대응을 위한 두 가지 옵션을 분석한다.

### 옵션 1 — 숨겨진 DOM 텍스트 레이어 (ARIA Overlay)

Canvas 위에 `position: absolute` DOM 레이어를 overlay하고,
에이전트 위치에 해당하는 ARIA 텍스트 요소를 배치한다.

```tsx
// 개념적 구조
<div style={{ position: 'relative' }}>
  <canvas ref={canvasRef} />
  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
    {agents.map(agent => (
      <span
        key={agent.id}
        role="status"
        aria-label={`${agent.name}: ${status}`}
        style={{
          position: 'absolute',
          left: agent.canvasX,
          top: agent.canvasY,
          // 시각적으로 숨기되 스크린리더에 노출
          width: '1px', height: '1px',
          overflow: 'hidden', clip: 'rect(0,0,0,0)',
        }}
      >
        {agent.name} — {status}
      </span>
    ))}
  </div>
</div>
```

**장점**:
- OfficePage 자체에서 스크린리더 지원 가능
- WCAG 2.1 Level AA 준수 가능
- Canvas 시각적 표현은 그대로 유지

**단점**:
- Canvas 게임 루프(60fps)와 DOM 위치 동기화 필요 — 매 프레임마다 에이전트 위치를 DOM에 반영
- CLAUDE.md 규칙: "Canvas API 직접 호출 금지 — useGameEngine 훅을 통해서만 접근" → 에이전트 캔버스 좌표를 게임엔진 밖으로 노출해야 하는 설계 변경 필요
- 60fps 렌더링에서 DOM 업데이트는 성능 문제 가능성 (React reconciliation 부담)
- OfficePage가 현재 Phase 1 제외 → 구현 시점 불명확, 설계 변경 비용 큼

**적합도**: Phase 2 구현 시 고려할 수 있으나, 게임엔진 격리 원칙과 충돌하므로 설계 논의 필요.

---

### 옵션 2 — OfficePage를 시각적 보조 뷰로 포지셔닝

OfficePage는 "에이전트 오피스 시각화" 대시보드로 정의하고,
실제 상호작용과 접근성은 AgentsPage(텍스트 목록)에서 보장한다.

**포지셔닝 원칙**:
- AgentsPage = 주요 작업 뷰. 모든 에이전트 작업(실행/모니터링/결과 확인)의 접근성 기반.
- OfficePage = 보조 시각화 뷰. 에이전트 활동의 공간적 표현. 접근성 요구사항 면제.
- 사이드바에서 두 뷰 간 명확한 구분 제공 (현재: "에이전트 목록" vs "에이전트 오피스" — OK)

**장점**:
- 구현 복잡도 없음
- 게임엔진 격리 원칙(`game/은 순수 Canvas`) 완전 준수
- AgentsPage가 이미 텍스트 레이블(StatusBadge) + 키보드 탐색 기반 구조를 갖춤
- WCAG 기준: 동일 정보를 접근 가능한 대안 뷰에서 제공하면 허용됨

**단점**:
- OfficePage 자체의 접근성 없음 — 스크린리더 사용자는 OfficePage에서 에이전트 상태 파악 불가
- "보조 뷰"임을 명시적으로 문서화하고 UI에서도 안내 필요
- 사용자가 OfficePage를 주 작업 뷰로 오해할 경우 경험 단절

**적합도**: Phase 2에서 OfficePage를 구현할 때 선택하기 좋은 기본 포지션.
추후 충분한 사용자 피드백이 있으면 옵션 1로 전환 검토.

---

## 5. prefers-reduced-motion 수정 스펙

### 현재 상태

`StatusBadge.tsx:15-25` — `radar-pulse` @keyframes를 `document.head`에 직접 주입.
`variables.css:56-61` — `@media (prefers-reduced-motion: reduce)` override는 `pulse` keyframe만 대상. `radar-pulse`는 적용 안 됨.

**결과**: 접근성 설정에서 "모션 줄이기"를 켠 사용자에게도 pulse 애니메이션 실행됨.

### 수정 스펙

`StatusBadge.tsx`에서 `radar-pulse` keyframe 주입 시 `prefers-reduced-motion` 규칙을 함께 포함:

```typescript
el.textContent =
  '@keyframes radar-pulse {' +
  '  0%, 100% { box-shadow: 0 0 4px var(--status-working); }' +
  '  50%       { box-shadow: 0 0 12px var(--status-working), 0 0 24px var(--status-working); }' +
  '}' +
  '@media (prefers-reduced-motion: reduce) {' +
  '  @keyframes radar-pulse { 0%, 100% { box-shadow: 0 0 4px var(--status-working); } }' +
  '}';
```

`@media (prefers-reduced-motion: reduce)` 안에서 `radar-pulse`를 정적 상태(glow 고정, animation 없음)로 override.
별도 JS 분기 불필요 — CSS keyframe 정의가 no-op이 되므로 `animation` 속성 자체를 건드리지 않아도 됨.

---

## 6. OfficePage Canvas 접근성 구현 스펙 (옵션 2 최종)

> **확정 회의**: Meeting #25
> **채택 이유**: 게임엔진 격리 원칙(`game/은 순수 Canvas`) 준수 + 60fps 유지 + 구현 복잡도 없음

### 6.1 Canvas 컨테이너 — role + aria-label

`OfficePage.tsx:176` — Canvas 컨테이너 `<div ref={containerRef}>` 에 추가:

```tsx
<div
  ref={containerRef}
  role="img"
  aria-label="에이전트 오피스 — 실시간 에이전트 활동을 시각화하는 2.5D 공간입니다. 상세 정보는 에이전트 목록 페이지에서 확인할 수 있습니다."
  style={{ ... }}
  ...
>
```

**선택 근거**:
- `role="img"` — Canvas 전체를 단일 이미지 요소로 스크린리더에 노출. DOM 구조 없는 Canvas에 적합.
- `aria-label` 문구 — "시각화 공간"임을 명시 + "에이전트 목록 페이지"를 접근 가능한 대안으로 안내.
- DOM ARIA overlay(옵션 1)는 60fps 루프에서 DOM 동기화 필요 → 격리 원칙 위반 → 채택하지 않음.

### 6.2 뷰 토글 버튼 — aria-pressed

`OfficePage.tsx:153-170` — 뷰 토글 버튼에 `aria-pressed` 추가:

```tsx
<button
  key={v}
  onClick={() => setView(v)}
  aria-pressed={view === v}
  style={{ ... }}
>
  {v === 'office' ? 'Office' : 'List'}
</button>
```

**선택 근거**:
- `aria-pressed` — 현재 활성 뷰를 스크린리더에 알림 (`true`/`false` 토글).
- `role="button"`은 이미 `<button>` 태그로 묵시적 적용되므로 별도 추가 불필요.

### 6.3 구현 범위 요약

| 파일 | 변경 사항 | 범위 |
|------|-----------|------|
| `OfficePage.tsx` | Canvas 컨테이너 `role="img"` + `aria-label` 추가 | 1줄 속성 추가 |
| `OfficePage.tsx` | 토글 버튼 `aria-pressed` 추가 | 1줄 속성 추가 (버튼 2개) |
| `StatusBadge.tsx` | `radar-pulse` keyframe에 `prefers-reduced-motion` override 추가 | 4줄 CSS 추가 |

총 변경량: 6줄. 기존 기능·렌더링에 영향 없음.

### 6.4 WCAG 준수 수준

- `role="img"` + `aria-label`: WCAG 2.1 §1.1.1 Non-text Content — Level A
- `aria-pressed`: WCAG 2.1 §4.1.2 Name, Role, Value — Level A
- `prefers-reduced-motion`: WCAG 2.1 §2.3.3 Animation from Interactions — Level AAA (권장)
- Canvas 자체 접근성 없음(옵션 1 미채택)으로 WCAG Level AA 완전 준수는 불가 — 인정하는 트레이드오프.

---

## 7. 권장사항 요약

| 항목 | 권장 | 이유 |
|------|------|------|
| 아이콘 방안 | Option A (현재 텍스트 레이블 유지) | StatusBadge에 이미 텍스트 레이블 있음. 아이콘 추가는 중복 |
| 아이콘 크기 기준 | 최소 12px | 8px 유니코드 아이콘은 가독성 불가 |
| Canvas 접근성 | 옵션 2 (보조 뷰 포지셔닝) | 게임엔진 격리 원칙 준수, 구현 복잡도 없음 |
| AgentsPage 접근성 | 현재 구현으로 기본 요건 충족 | StatusBadge 텍스트 레이블 + 정렬 순서 |

### Phase 2 접근성 구현 우선순위 (확정 — Meeting #25)

| 순서 | 항목 | 파일 | Phase 2 단계 |
|------|------|------|-------------|
| 1 | `prefers-reduced-motion` — `radar-pulse` override 추가 | `StatusBadge.tsx` | Step 1 (결함 수정) |
| 2 | Canvas 컨테이너 `role="img"` + `aria-label` | `OfficePage.tsx` | Step 1 (결함 수정) |
| 3 | 뷰 토글 버튼 `aria-pressed` | `OfficePage.tsx` | Step 1 (결함 수정) |
| 4 | Canvas 접근성 전략 구현 (옵션 2) | `OfficePage.tsx` | Step 3 (보강) |

**결함 수정(1-3)**: L2 검증과 병렬 처리 가능. 코드 변경량 6줄. 다른 작업 의존 없음.
**보강(4)**: Canvas 접근성 전략은 OfficePage L2 검증 완료 후 진행. Section 6 구현 스펙 참조.
