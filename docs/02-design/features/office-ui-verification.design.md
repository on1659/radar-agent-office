# OfficePage UI 검증 기준 + 대표님 시각 확인 체크리스트

> **작성자**: 도윤 (UI/UX Designer)
> **작성일**: 2026-04-09
> **대상**: OfficePage Canvas 뷰 4개 UI 요소 — 서진 검증 + 대표님 시각 확인
> **관련 회의**: Meeting #24

---

## 1. OfficePage UI 요소별 L2→L3 판정 기준

L2 = 코드 레벨 확인 (파일 존재, 연결 여부)
L3 = 런타임 시각 확인 (브라우저에서 실제 렌더링)

회의 에이전트 환경에서 L3 브라우저 확인은 불가. L2는 서진이 코드 검증, L3는 대표님 시각 확인으로 분리.

---

### 1.1 타일맵 (TileMap)

**L2 — 코드 레벨 판정 기준**

| 확인 항목 | 위치 | 판정 |
|-----------|------|------|
| `TileMap.ts` 파일 존재 | `packages/client/src/game/TileMap.ts` | 파일 있으면 L2 ✅ |
| `GameEngine.ts`에서 `new TileMap()` 초기화 | `GameEngine.ts` constructor | 호출 있으면 L2 ✅ |
| `OfficePage.tsx`에서 `tileMapRef` canvas 연결 | `OfficePage.tsx:192` — `<canvas ref={tileMapRef} />` | ref 연결 있으면 L2 ✅ |
| `useGameEngine` 훅이 `tileMapRef` 반환 | `useGameEngine.ts` return | 반환값 있으면 L2 ✅ |

**L3 — 브라우저 시각 판정 기준**

`localhost:5173/office` 접속 후:

| 확인 항목 | 통과 기준 | 실패 기준 |
|-----------|----------|----------|
| Canvas 영역 렌더링 | 테두리 있는 사각형 영역 안에 타일 패턴 보임 | 빈 회색/검정 박스만 보임 |
| 타일 형태 | 2.5D 아이소메트릭 — 마름모형 타일들이 오프셋 배열로 배치됨 | 평면 격자 또는 아무것도 없음 |
| 타일 종류 구분 | 색상/패턴으로 바닥(FLOOR), 책상(DESK), 벽(WALL) 구분됨 | 단색 배경 |

**블로커 판정**: L3에서 Canvas가 완전히 빈 경우 → 블로커. 타일이 보이면 L3 통과.

---

### 1.2 스프라이트 (Character Sprite)

**L2 — 코드 레벨 판정 기준**

| 확인 항목 | 위치 | 판정 |
|-----------|------|------|
| `Character.ts` 파일 존재 + `PIXEL_DATA` import | `Character.ts:1` | L2 ✅ |
| `SEAT_POSITIONS` 8개 정의 (책상 위치) | `GameEngine.ts:15-23` | L2 ✅ |
| `GameEngine`에서 agentIds 기준 Character 생성 | `GameEngine.ts` — characters Map | L2 ✅ |
| `characterRef` canvas에 스프라이트 렌더링 | `OfficePage.tsx:193` — `<canvas ref={characterRef} />` | L2 ✅ |

**L3 — 브라우저 시각 판정 기준**

| 확인 항목 | 통과 기준 | 실패 기준 |
|-----------|----------|----------|
| 캐릭터 존재 | 타일맵 위에 작은 픽셀아트 캐릭터 1개 이상 보임 | 타일맵만 있고 캐릭터 없음 |
| 책상 위치 배치 | 캐릭터들이 책상 타일 근처에 위치함 | 빈 공간에 무작위 배치 |
| idle 상태 | 캐릭터가 제자리에서 미세하게 움직임 (breathing) | 완전히 정지 또는 움직임 없음 |

**비고**: 에이전트 데이터 없을 때 demo 에이전트 8개(`jimin`, `hyunwoo` 등)로 기본 배치 — 이 경우에도 스프라이트 렌더링 확인 가능. (`OfficePage.tsx:36-40`)

**블로커 판정**: 타일맵은 보이는데 캐릭터가 전혀 안 보이면 → 블로커.

---

### 1.3 말풍선 (SpeechBubble)

**L2 — 코드 레벨 판정 기준**

| 확인 항목 | 위치 | 판정 |
|-----------|------|------|
| `SpeechBubble.tsx` 컴포넌트 존재 | `components/SpeechBubble.tsx` | L2 ✅ |
| `OfficePage.tsx`에서 working 에이전트에 렌더링 | `OfficePage.tsx:195-202` — `{speechBubbles.map(...)}` | L2 ✅ |
| 조건: `agentStatuses[id] === 'working'` + `currentTasks[id]` 존재 | `OfficePage.tsx:73-84` | L2 ✅ |
| Canvas 위에 `position: absolute` 오버레이 | `SpeechBubble.tsx` inline style | L2 ✅ |

**L3 — 브라우저 시각 판정 기준**

말풍선은 **working 에이전트 + currentTask가 있을 때만** 렌더링됨. 에이전트 없이는 확인 불가.

| 상황 | 판정 |
|------|------|
| working 에이전트 없음 | L3 확인 불가 — **비블로커**, Phase 2 Step 2 검증으로 이관 |
| working 에이전트 있음 | 캐릭터 머리 위에 말풍선 박스 + 작업 텍스트가 보여야 L3 ✅ |
| 말풍선 위치 | 캐릭터 머리 위 (-28px Y 오프셋), 텍스트가 잘리면 ellipsis 처리 |

**블로커 판정**: working 에이전트 있는데 말풍선이 아예 안 보이면 → 블로커. working 에이전트 없으면 판정 보류.

---

### 1.4 뷰 토글 (View Toggle)

**L2 — 코드 레벨 판정 기준**

| 확인 항목 | 위치 | 판정 |
|-----------|------|------|
| `view` state 존재 (`'office' \| 'list'`) | `OfficePage.tsx:12` | L2 ✅ |
| 토글 버튼 렌더링 (2개) | `OfficePage.tsx:152-171` | L2 ✅ |
| `view === 'office'` → Canvas 렌더링 | `OfficePage.tsx:175` | L2 ✅ |
| `view === 'list'` → `AgentListView` 렌더링 | `OfficePage.tsx:203-217` | L2 ✅ |
| active 버튼 `var(--accent-blue)` 하이라이트 | `OfficePage.tsx:159` | L2 ✅ |

**L3 — 브라우저 시각 판정 기준**

| 확인 항목 | 통과 기준 | 실패 기준 |
|-----------|----------|----------|
| 토글 버튼 위치 | 우측 상단 "Office" / "List" 버튼 2개 보임 | 버튼 없음 |
| active 상태 표시 | 현재 뷰 버튼이 파란색 배경으로 강조됨 | 두 버튼 구분 없음 |
| Canvas → List 전환 | "List" 클릭 시 표 형태로 즉시 전환 | 반응 없음 또는 지연 |
| List → Canvas 전환 | "Office" 클릭 시 Canvas로 즉시 복귀 | 반응 없음 또는 공백 |
| 전환 후 상태 유지 | 드롭다운에서 선택한 에이전트가 전환 후에도 유지 | 선택 초기화 |

**블로커 판정**: 버튼이 없거나 클릭해도 아무 반응이 없으면 → 블로커. 전환 애니메이션 없음은 비블로커.

---

## 2. 대표님용 시각 확인 체크리스트

> npm run dev 실행 후 터미널에서 확인한 주소로 접속하세요.
> 일반적으로 http://localhost:5173 이며, 포트가 다르면 터미널 출력의 `Local:` 항목 참조.

---

### Phase 1 검증 — AgentsPage

**접속 주소**: `http://localhost:5173/agents`

```
[ 1. 초기 연결 확인 ]

□ 사이드바가 보이고 메뉴 항목들이 나열됨
  → ✅ 통과
□ "Server not reachable. Run: npm run dev" 에러 화면이 나옴
  → ❌ 블로커 (서버가 안 뜬 것 — npm run dev 실행 확인)
□ 흰 화면이나 아무것도 안 보임
  → ❌ 블로커 (런타임 에러 — F12 콘솔 확인)
```

```
[ 2. 사이드바 ]

□ 왼쪽에 사이드바가 보임
□ "🤖 에이전트 목록" 항목이 보임
□ "🤖 에이전트 목록" 클릭 시 URL이 /agents로 바뀜
□ 클릭한 항목이 파란색으로 강조됨 (active 상태)

  전부 ✅ → 통과
  하나라도 없으면 → 비블로커 (Phase 2에서 수정)
```

```
[ 3. AgentsPage 레이아웃 ]

페이지를 /agents로 이동한 상태에서:

□ 화면 왼쪽 약 1/3에 "에이전트 목록" 헤더가 보임
□ 화면 오른쪽 약 2/3에 "로그 패널" 헤더가 보임
□ 두 영역 사이에 구분선이 있음

  전부 ✅ → 통과
  비율이 조금 다르면 → 비블로커
  한쪽 영역이 아예 없으면 → 블로커
```

```
[ 4. 에이전트 없을 때 Empty State ]

왼쪽 목록 영역에:

□ "No agents found. Check WORKSPACE_ROOT." 텍스트가 보임
□ 텍스트가 읽을 수 있는 색상으로 표시됨 (배경과 충분한 대비)

  전부 ✅ → Phase 1 검증 완료
  텍스트가 안 보이면 → 비블로커
```

**Phase 1 통과 기준**: 위 4개 항목에서 블로커 0개.

---

### Phase 2 사전 확인 — OfficePage

> Phase 1 검증 완료 후 진행하세요.
> **접속 주소**: `http://localhost:5173/office`

```
[ 1. OfficePage 기본 렌더링 ]

□ 페이지 제목 "에이전트 오피스"가 보임
□ Canvas 영역(테두리 있는 사각형)이 보임
□ Canvas 안에 2.5D 격자 형태의 타일맵이 그려짐
  (마름모형 타일들이 오프셋으로 배열된 형태)
□ 타일맵 위에 작은 픽셀 캐릭터들이 배치됨

  타일맵 보임 + 캐릭터 보임 → ✅ 통과
  Canvas 안이 완전히 비어있음 → ❌ 블로커
  타일맵은 보이는데 캐릭터 없음 → ❌ 블로커
```

```
[ 2. 뷰 토글 ]

우측 상단 버튼 영역:

□ "Office" / "List" 버튼 2개가 보임
□ 현재 보이는 뷰에 해당하는 버튼이 파란색으로 강조됨
□ "List" 버튼 클릭 시 에이전트 표 형태로 전환됨
□ "Office" 버튼 클릭 시 Canvas 뷰로 다시 전환됨
□ 전환이 즉각적임 (버튼 클릭 후 바로 변경)

  전부 ✅ → 통과
  버튼 없음 → ❌ 블로커
  클릭해도 반응 없음 → ❌ 블로커
  전환은 되지만 약간 느림 → 비블로커
```

```
[ 3. 에이전트 선택 + 로그 패널 ]

상단 드롭다운 ("로그 에이전트 선택..."):

□ 드롭다운을 클릭하면 에이전트 목록이 나옴
□ 에이전트 선택 시 페이지 하단에 "로그 패널"이 나타남

  ✅ → OfficePage Phase 2 사전 확인 완료
  드롭다운에 아무것도 없음 → 비블로커 (에이전트 미연결 상태)
```

```
[ 보너스 — Canvas 드래그/줌 (Phase 2 추가 확인) ]

Canvas 영역에서:

□ 마우스 드래그로 화면을 이동할 수 있음
□ 마우스 휠로 줌 인/아웃 됨

  ✅ → 카메라 조작 정상
  드래그/줌 안 됨 → 비블로커 (기능은 있지만 UX 문제)
```

**Phase 2 사전 통과 기준**: 1번 (타일맵+캐릭터) + 2번 (토글) 블로커 0개.

---

## 3. 판정 참조

| 분류 | 기준 | 대응 |
|------|------|------|
| **블로커** | 페이지 접근 불가, Canvas 완전히 빈 화면, 버튼 클릭 무반응 | Phase 진행 유보 + 즉시 수정 |
| **비블로커** | 레이아웃 비율 어색, 색상 미세 차이, 전환 속도 느림 | 현 Phase 통과 + 다음 Phase에서 수정 |
| **확인 불가** | working 에이전트 없어서 말풍선 확인 못 함 | Step 2 검증으로 이관 |
