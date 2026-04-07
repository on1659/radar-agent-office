# Web Dashboard Design Document

> **Summary**: Claude Code 에이전트 시스템을 시각화하고 직접 작업을 수행하는 웹 기반 통합 대시보드
>
> **Project**: radar-agent-office
> **Version**: 0.1.0
> **Author**: user
> **Date**: 2026-03-30
> **Status**: Draft
> **Planning Doc**: [web-dashboard.plan.md](../../01-plan/features/web-dashboard.plan.md)

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 멀티에이전트 CLI 작업의 비가시성 — 무엇이 돌고 있는지, 어디까지 진행됐는지 한눈에 알 수 없음 |
| **WHO** | 1차: Claude Code 멀티에이전트 파워유저, 2차: AI 관심 개발자, 3차: 비개발자 |
| **RISK** | 스코프 폭발 (8개 모듈 1인 개발), Anthropic 공식 도구 출시 시 경쟁력 상실 |
| **SUCCESS** | Phase 1 MVP 4주 내 완성, 에이전트 오피스 + 작업 루프 동작, 외부 피드백 수집 |
| **SCOPE** | Phase 0(2주) 기반구축 → Phase 1(4주) MVP → Phase 2(4주) 시각화 → Phase 3(4주) 고급 기능 |

---

## 1. Overview

### 1.1 Design Goals

- 대시보드 하나로 에이전트 상태 확인 → 작업 지시 → 진행 관찰 → 결과 승인까지 완결
- 기존 claude_team_gui 게임엔진(~2,400줄)과 UI 컴포넌트(~2,000줄) 최대 재사용
- 배포 가능한 제품 품질 (다른 사용자 배포 목표)
- 프론트/백엔드 독립 배포 가능한 모노레포 구조

### 1.2 Design Principles

- **Package Isolation**: 프론트/백엔드/공유 타입을 독립 패키지로 분리
- **WebSocket-first**: 에이전트 실시간 상태를 모든 화면에서 자동 반영
- **Progressive Disclosure**: 첫 화면은 오피스 + 핵심지표 3개만, 디테일은 클릭/탭으로 확장
- **Security by Default**: 127.0.0.1 바인딩, 토큰 인증, API 키 서버 프록시

---

## 2. Architecture

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Clean Monorepo | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | 단일 src/ | 독립 패키지 monorepo | 2-폴더 분리 |
| **New Files** | ~25 | ~40 | ~30 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Medium | High | High |
| **배포 분리** | 불가 | **가능** | 불가 |
| **Recommendation** | 프로토타입 | **제품 배포** | 1인 로컬 |

**Selected**: Option B (Clean Monorepo) — **Rationale**: 다른 사용자에게 배포할 제품. 프론트/백엔드 독립 배포, 독립 테스트, shared 패키지로 타입 안전성 보장.

### 2.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                 Browser (localhost:5173)                      │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐   │
│  │  Agent   │  System  │  Usage   │ Pipeline │ Project  │   │
│  │  Office  │ Overview │  Stats   │   Flow   │  Board   │   │
│  ├──────────┴──────────┴──────────┴──────────┴──────────┤   │
│  │              Command Bar (항상 하단 고정)               │   │
│  └──────────────────────────────────────────────────────┘   │
│          ↕ WebSocket (ws://127.0.0.1:3001?token=xxx)        │
├─────────────────────────────────────────────────────────────┤
│                  Fastify Server (:3001)                       │
│  ┌──────────────┬──────────────┬──────────────────────────┐ │
│  │ REST API     │ WS Bridge    │ AgentProcessPool         │ │
│  │ /api/*       │ 실시간 스트림 │ (p-limit, max concur=4) │ │
│  ├──────────────┼──────────────┼──────────────────────────┤ │
│  │ .claude/     │ SQLite       │ Claude CLI subprocess    │ │
│  │ Parser       │ (세션이력)    │ spawn('claude', args)    │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Monorepo Structure

```
radar-agent-office/
├── packages/
│   ├── client/                    # @radar/client — React SPA
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   ├── index.html
│   │   └── src/
│   │       ├── main.tsx
│   │       ├── App.tsx            # React Router
│   │       ├── layouts/
│   │       │   └── DashboardShell.tsx
│   │       ├── pages/
│   │       │   ├── OfficePage.tsx
│   │       │   ├── OverviewPage.tsx
│   │       │   ├── StatsPage.tsx       # Phase 2
│   │       │   ├── PipelinePage.tsx     # Phase 3
│   │       │   └── ProjectPage.tsx     # Phase 2
│   │       ├── components/
│   │       │   ├── CommandBar.tsx
│   │       │   ├── AgentCard.tsx
│   │       │   ├── SpeechBubble.tsx
│   │       │   ├── StatusBadge.tsx
│   │       │   ├── Sidebar.tsx
│   │       │   ├── AgentListView.tsx
│   │       │   └── LogPanel.tsx
│   │       ├── game/               # 기존 엔진 이식
│   │       │   ├── GameEngine.ts
│   │       │   ├── TileMap.ts
│   │       │   ├── Character.ts
│   │       │   ├── Camera.ts
│   │       │   ├── Pathfinder.ts
│   │       │   ├── isoTransform.ts
│   │       │   └── useGameEngine.ts
│   │       ├── shared/             # 기존 공유 코드
│   │       │   ├── pixel-data.ts
│   │       │   └── PixelAvatar.tsx
│   │       ├── hooks/
│   │       │   ├── useWebSocket.ts
│   │       │   └── useChunkBuffer.ts
│   │       ├── store/              # Zustand
│   │       │   ├── useAgentStore.ts
│   │       │   ├── useWorkspaceStore.ts
│   │       │   └── useDashboardStore.ts
│   │       └── theme/
│   │           ├── dark.css
│   │           └── variables.css
│   │
│   ├── server/                    # @radar/server — Fastify API
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts           # Fastify 진입점
│   │       ├── config.ts          # 환경변수, 포트, 토큰
│   │       ├── routes/
│   │       │   ├── workspace.ts   # GET /api/workspace/*
│   │       │   ├── agent.ts       # POST /api/agent/run|stop
│   │       │   ├── stats.ts       # GET /api/stats/*
│   │       │   └── sessions.ts    # GET /api/sessions
│   │       ├── services/
│   │       │   ├── agent-pool.ts  # AgentProcessPool (p-limit)
│   │       │   ├── cli-runner.ts  # Claude CLI subprocess 관리
│   │       │   └── workspace-scanner.ts  # .claude/ 파싱 오케스트레이터
│   │       ├── ws/
│   │       │   ├── handler.ts     # WebSocket 연결 관리
│   │       │   └── events.ts      # 이벤트 타입 가드
│   │       ├── parsers/
│   │       │   ├── agent-parser.ts
│   │       │   ├── skill-parser.ts
│   │       │   ├── hook-parser.ts
│   │       │   └── rule-parser.ts
│   │       └── db/
│   │           ├── schema.ts      # SQLite 스키마
│   │           └── client.ts      # better-sqlite3 인스턴스
│   │
│   └── shared/                    # @radar/shared — 공유 타입
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── index.ts
│           ├── agent.ts
│           ├── workspace.ts
│           ├── events.ts
│           └── api.ts
│
├── package.json                   # workspace root
├── turbo.json                     # 빌드 오케스트레이션
├── tsconfig.base.json
└── .env.example
```

### 2.3 Dependencies

| Package | Component | Purpose |
|---------|-----------|---------|
| `react` + `react-dom` | client | UI |
| `react-router-dom` | client | SPA 라우팅 |
| `zustand` | client | 상태 관리 |
| `recharts` | client | 차트 (Phase 2) |
| `@xyflow/react` | client | 파이프라인 그래프 (Phase 3) |
| `fastify` | server | HTTP 서버 |
| `@fastify/websocket` | server | WebSocket |
| `better-sqlite3` | server | 세션 DB |
| `p-limit` | server | 동시 프로세스 제한 |
| `chokidar` | server | .claude/ 파일 감시 |
| `turborepo` | root | 모노레포 빌드 |

### 2.4 Data Flow

```
[사용자] 커맨드바 입력
    ↓ WebSocket "runAgent"
[서버] AgentProcessPool.enqueue()
    ↓ p-limit (max 4)
[서버] cli-runner.spawn('claude', [...args])
    ↓ stdout stream
[서버] WS broadcast "agentStream"
    ↓
[클라이언트] useWebSocket → useAgentStore.update()
    ↓
[UI] AgentCard 상태 변경 + SpeechBubble + LogPanel 스트리밍
    ↓ 완료 시
[서버] SQLite 세션 기록 + WS "agentDone"
```

---

## 3. Data Model

### 3.1 Core Types (@radar/shared)

```typescript
// === Agent ===
interface Agent {
  id: string;
  name: string;
  department: Department;
  model: 'opus' | 'sonnet' | 'haiku';
  role: string;
  status: AgentStatus;
  currentTask?: string;
  startedAt?: string;
}

type AgentStatus = 'idle' | 'working' | 'error' | 'queued';
type Department = 'dev' | 'review' | 'ops' | 'biz' | 'legal' | 'invest';

// === Workspace ===
interface WorkspaceOverview {
  agents: number;
  skills: number;
  hooks: number;
  rules: number;
  pipelines: number;
  mcpServers: number;
  total: number;
  activeJobs: number;
  modelDistribution: Record<string, number>;
}

interface Skill {
  name: string;
  path: string;
  description: string;
  type: 'workflow' | 'capability' | 'hybrid';
}

interface Hook {
  event: string;
  command: string;
  type: 'shell' | 'http';
}

interface Rule {
  content: string;
  source: string;
  priority: 'urgent' | 'important' | 'normal';
}

// === WebSocket Events ===
type ServerEvent =
  | { type: 'agentStream'; agentId: string; chunk: string }
  | { type: 'agentQueued'; agentId: string; position: number }
  | { type: 'agentDone'; agentId: string; result: AgentResult }
  | { type: 'statusUpdate'; agentId: string; status: AgentStatus }
  | { type: 'workspaceUpdate'; overview: WorkspaceOverview }
  | { type: 'approvalRequest'; sessionId: string; agentId: string; command: string; reason: string }
  | { type: 'activityEvent'; entry: ActivityEntry };

type ClientEvent =
  | { type: 'runAgent'; agentId: string; prompt: string; workspace?: string }
  | { type: 'stopAgent'; agentId: string };

// === Session ===
interface Session {
  id: string;
  agentId: string;
  prompt: string;
  result?: string;
  status: 'running' | 'completed' | 'error' | 'stopped';
  tokensUsed?: number;
  startedAt: string;
  completedAt?: string;
}

interface AgentResult {
  output: string;
  filesChanged: string[];
  tokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  duration: number;
  exitCode: number;
}

// === Activity Log ===
interface ActivityEntry {
  id: string;
  type: 'agent_started' | 'agent_done' | 'agent_error' | 'agent_stopped';
  agentId: string;
  sessionId?: string;
  description: string;
  timestamp: string;
}

// === Cost Summary ===
interface CostSummary {
  agentId: string;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCostUsd: number;
  sessionCount: number;
  date?: string;  // 날짜별 필터 시
}
```

### 3.2 SQLite Schema

```sql
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  prompt TEXT NOT NULL,
  result TEXT,
  status TEXT NOT NULL DEFAULT 'running',
  tokens_used INTEGER,
  input_tokens INTEGER,
  output_tokens INTEGER,
  cost_usd REAL,
  project_tag TEXT,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  workspace_path TEXT
);

CREATE TABLE daily_stats (
  date TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  tool_name TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  PRIMARY KEY (date, agent_id, tool_name)
);

-- 세션 타임라인용 활동 로그 (Paperclip Activity Log 경량화)
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,  -- 'agent_started' | 'agent_done' | 'agent_error' | 'agent_stopped'
  agent_id TEXT NOT NULL,
  session_id TEXT REFERENCES sessions(id),
  description TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_sessions_agent ON sessions(agent_id);
CREATE INDEX idx_sessions_status ON sessions(status);
CREATE INDEX idx_sessions_project ON sessions(project_tag);
CREATE INDEX idx_daily_stats_date ON daily_stats(date);
CREATE INDEX idx_activity_log_time ON activity_log(timestamp);
```

---

## 4. API Specification

### 4.1 REST Endpoints

| Method | Path | Description | Auth |
|--------|------|-------------|------|
| GET | `/api/workspace/overview` | 시스템 개요 | Token |
| GET | `/api/workspace/agents` | 에이전트 목록 + 상태 | Token |
| GET | `/api/workspace/skills` | 스킬 목록 | Token |
| GET | `/api/workspace/hooks` | 훅 설정 | Token |
| GET | `/api/workspace/rules` | 규칙 목록 | Token |
| POST | `/api/agent/run` | 에이전트 작업 실행 | Token |
| POST | `/api/agent/stop` | 에이전트 작업 중지 | Token |
| GET | `/api/sessions` | 세션 이력 (pagination) | Token |
| GET | `/api/sessions/:id` | 세션 상세 | Token |
| GET | `/api/stats/usage` | 도구 사용 통계 (Phase 2) | Token |
| GET | `/api/stats/daily` | 일별 활동량 (Phase 2) | Token |
| GET | `/api/stats/costs` | 에이전트별/일별 비용 집계 | Token |
| GET | `/api/activity` | 활동 로그 타임라인 (pagination) | Token |

### 4.2 Key Endpoint: POST /api/agent/run

**Request:**
```json
{
  "agentId": "architect",
  "prompt": "현재 시스템 아키텍처를 분석해줘",
  "workspace": "/path/to/project"
}
```

**Response (202 Accepted):**
```json
{
  "sessionId": "sess_abc123",
  "agentId": "architect",
  "status": "queued",
  "position": 0
}
```

**Errors:** 400(잘못된 입력), 401(미인증), 409(이미 작업 중), 429(한도 초과)

### 4.3 WebSocket Protocol

```
# 연결: ws://127.0.0.1:3001/ws?token={auth_token}

# 서버→클라이언트
{"type":"agentStream","agentId":"architect","chunk":"분석 시작..."}
{"type":"agentDone","agentId":"architect","result":{...}}
{"type":"statusUpdate","agentId":"dev-1","status":"working"}

# 클라이언트→서버
{"type":"runAgent","agentId":"architect","prompt":"분석해줘"}
{"type":"stopAgent","agentId":"dev-1"}
```

- 인증: query param `token` (실패 시 close 4001)
- 하트비트: 30초 ping/pong
- 메시지 크기: 최대 64KB
- 레이트 리밋: 10 req/s per connection
- 재연결: 1→2→4→8→30초 (5회 실패 시 수동)

---

## 5. UI/UX Design

### 5.1 Layout

```
┌────────────────────────────────────────────────┐
│ ┌────────┐ ┌──────────────────────────────────┐│
│ │Sidebar │ │       Main Content Area          ││
│ │ 200px  │ │                                  ││
│ │        │ │                                  ││
│ │ Nav    │ ├──────────────────────────────────┤│
│ │ items  │ │  CommandBar (fixed bottom)       ││
│ └────────┘ └──────────────────────────────────┘│
└────────────────────────────────────────────────┘
```

### 5.2 Navigation

| Label | Route | Phase |
|-------|-------|-------|
| 시스템 개요 | `/` | 1 |
| 에이전트 오피스 | `/office` | 1 |
| 활동 타임라인 | `/activity` | 1 |
| 사용 통계 | `/stats` | 2 |
| 파이프라인 | `/pipeline` | 3 |
| 프로젝트 | `/project` | 2 |
| 설정 | `/settings` | 1 |

### 5.3 Component List

| Component | Responsibility |
|-----------|----------------|
| `DashboardShell` | CSS Grid (sidebar + main + commandbar) |
| `Sidebar` | 네비게이션 + 프로젝트 선택 |
| `CommandBar` | 하단 고정, 에이전트 선택 → 프롬프트 → 실행 |
| `OfficePage` | 2.5D 픽셀아트 오피스 (Canvas) |
| `AgentListView` | 테이블 기반 에이전트 목록 |
| `OverviewPage` | 시스템 개요 카드 + 차트 |
| `AgentCard` | 에이전트 정보 카드 (기존 재사용) |
| `SpeechBubble` | 말풍선 (기존 재사용) |
| `StatusBadge` | 4색 상태 배지 |
| `LogPanel` | 실시간 작업 로그 스트리밍 |
| `GameEngine` | Canvas 2.5D 렌더링 (기존 이식) |
| `ApprovalModal` | 위험 작업 감지 시 확인 다이얼로그 |
| `TokenBudgetBadge` | CommandBar 우측 오늘 토큰/비용 표시 |
| `ActivityPage` | 날짜별 에이전트 활동 타임라인 |

### 5.4 Page UI Checklist

#### 시스템 개요 (OverviewPage)

- [ ] Summary bar: 에이전트/스킬/훅/규칙/파이프라인/MCP/종합 숫자
- [ ] Stat card x6: 각 항목 상세 (모델별, 우선순위별 등)
- [ ] Chart: 에이전트 카테고리 레이더 (SVG)
- [ ] Chart: 모델 분포 도넛 (Opus/Sonnet/Haiku)
- [ ] Activity: 프로젝트 업데이트 (최근 5개)
- [ ] Activity: 최근 에이전트 활동

#### 에이전트 오피스 (OfficePage)

- [ ] Toggle: 오피스 뷰 / 리스트 뷰 전환
- [ ] Canvas: 2.5D 아이소메트릭 타일맵 (20x14)
- [ ] Character: 부서별 배치, 모델별 외형 구분
- [ ] Status: 실시간 상태 (idle/working/error)
- [ ] Bubble: 작업 중 말풍선
- [ ] Click: 에이전트 상세 패널
- [ ] List: 테이블 뷰 (상태/이름/부서/역할/모델/현재작업/경과)

#### 커맨드바 (모든 페이지)

- [ ] Dropdown: 에이전트 선택 (이름 + 모델 배지)
- [ ] Input: 프롬프트 입력
- [ ] Button: 실행 (Enter)
- [ ] Button: 중지 (작업 중만)
- [ ] Badge: 활성 작업 수
- [ ] Status: 선택 에이전트 상태

---

## 6. Error Handling

| Code | Category | Client Handling |
|------|----------|-----------------|
| 400 | Validation | Toast + 입력 하이라이트 |
| 401 | Auth | 재인증 플로우 |
| 409 | Conflict | "이미 작업 중" Toast |
| 429 | RateLimit | 큐 대기 안내 |
| 500 | Server | ErrorBoundary + 재시도 |
| WS 4001 | WS Auth 실패 | 재연결 + 토큰 갱신 |

---

## 7. Security

- [x] 127.0.0.1 바인딩 (배포 시 reverse proxy)
- [x] 토큰 인증 (crypto.randomUUID, REST + WS)
- [x] API 키 서버 프록시 (브라우저에 키 미전송)
- [x] shell:true 제거
- [x] 경로 트래버설 방지 (path.resolve + 화이트리스트)
- [x] 레이트 리밋 (WS 10 req/s, REST 60 req/min)
- [x] 메시지 크기 제한 (WS 64KB, REST 1MB)

---

## 8. Test Plan

### 8.1 L1: API Tests

| # | Endpoint | Test | Expected |
|---|----------|------|----------|
| 1 | GET /api/workspace/overview | 시스템 개요 | 200, agents >= 0 |
| 2 | GET /api/workspace/agents | 에이전트 목록 | 200, array |
| 3 | POST /api/agent/run | 유효한 실행 | 202, sessionId |
| 4 | POST /api/agent/run | 잘못된 agentId | 400 |
| 5 | POST /api/agent/run | 미인증 | 401 |
| 6 | POST /api/agent/run | 이미 작업 중 | 409 |

### 8.2 L2: UI Tests

| # | Page | Action | Expected |
|---|------|--------|----------|
| 1 | Overview | 로드 | 6개 stat card |
| 2 | Office | 뷰 토글 | 전환 동작 |
| 3 | Office | 에이전트 클릭 | 상세 패널 |
| 4 | CommandBar | 실행 | 작업 시작 |

### 8.3 L3: E2E Tests

| # | Scenario | Steps |
|---|----------|-------|
| 1 | 작업 루프 | 오피스 → 클릭 → 실행 → 스트리밍 → 완료 |
| 2 | 뷰 전환 | 오피스↔리스트, 데이터 일관성 |
| 3 | 재연결 | 서버 재시작 → 자동 복구 |

---

## 9. Coding Convention

| Target | Rule |
|--------|------|
| Components | PascalCase.tsx |
| Hooks | useCamelCase.ts |
| Routes | kebab-case /api/* |
| WS Events | camelCase |
| CSS Variables | --dash-* |
| Import | Node → External → @radar/ → Relative → Styles |
| Env Variables | PORT, AUTH_TOKEN, CLAUDE_CLI_PATH, MAX_CONCURRENT, WORKSPACE_ROOT |

---

## 10. Phase Scope & Success Criteria

### 10.1 Phase Boundary Clarification

| Phase | Period | Core Deliverable | Exit Condition |
|-------|--------|------------------|----------------|
| **Phase 0** | W1–W2 | 모노레포 기반 인프라 | `npm run dev` 동작 + WS 연결 확인 |
| **Phase 1** | W3–W6 | MVP 핵심 3기능 | 에이전트 목록+상태, 에이전트 실행, 결과 스트리밍 동작 |
| **Phase 1.5** | W7–W8 | 보완 기능 | 온보딩 + 활동 타임라인 + 승인 모달 + 설정 |
| **Phase 2** | W9–W12 | 시각화 강화 | 사용 통계 + 프로젝트 보드 |
| **Phase 3** | W13–W16 | 고급 기능 | 파이프라인 그래프 + 카탈로그 |

#### Phase 1에서 제외된 항목

| Feature | 이동 Phase | 이유 |
|---------|-----------|------|
| 90초 온보딩 플로우 | Phase 1.5 | MVP 핵심 루프와 독립적 |
| 활동 타임라인 `/activity` | Phase 1.5 | SQLite 데이터는 Phase 1부터 쌓임, UI는 후순위 |
| 에이전트 클릭 → 인라인 상세 패널 | Phase 1.5 | AgentsPage 리스트 뷰로 대체 |
| 승인 모달 (ApprovalModal) | Phase 1.5 | `approvalRequest` WS 이벤트 수신 구현 후 진행 |
| 설정 페이지 `/settings` | Phase 1.5 | `.env`로 충분 |
| 사용 통계 | Phase 2 | recharts 도입, 데이터 축적 필요 |
| 프로젝트 관리 보드 | Phase 2 | 칸반 UI 별도 설계 |
| 파이프라인 시각화 | Phase 3 | @xyflow/react, 별도 설계 |

---

### 10.2 Feature 1 — 에이전트 목록 + 실시간 상태

**User Story**: 멀티에이전트 파워유저로서, 모든 에이전트의 실시간 상태를 한 화면에서 파악하고 싶다.

**레이아웃**: `AgentsPage` — 좌 1/3 에이전트 목록 + 우 2/3 LogPanel (1:2 수평 분할)

**성공 기준**:
- [ ] WS 연결 후 에이전트 목록 표시 (Status / Name / Department / Role / Model / Current Task)
- [ ] `statusUpdate` 이벤트 수신 시 해당 행의 StatusBadge 즉시 갱신 (에이전트 상태 변경은 WS 이벤트 수신으로만 처리 — 상태 폴링용 `setInterval`/`setTimeout` 없음. 하트비트·재연결 타이머는 이 기준 외)
- [ ] `working` 상태 에이전트가 목록 최상단에 고정 표시 — 정렬 순서: `working → queued → idle → error`
- [ ] 에이전트 0명일 때 "No agents found. Check WORKSPACE_ROOT." 표시

**구현 상태**: `AgentsPage.tsx` 완료 (173줄). working→queued→idle→error 정렬, 1/3·2/3 레이아웃, StatusBadge + LogPanel 연결, 완료 칩(tokensUsed/costUsd/duration), currentTasks 표시, 빈 상태 메시지 포함. 빌드 0 errors 통과 (2026-04-07).

---

### 10.3 Feature 2 — 에이전트 실행

**User Story**: 파워유저로서, 원하는 에이전트에게 커맨드바로 바로 작업을 지시하고 싶다.

**성공 기준**:
- [ ] 에이전트 선택 → 프롬프트 입력 → Enter/실행 버튼으로 `runAgent` WS 이벤트 전송
- [ ] 전송 후 대상 에이전트 StatusBadge가 `working`으로 즉시 전환
- [ ] 이미 `working` 상태 에이전트 선택 시 중지 버튼 활성화 → `stopAgent` 이벤트 전송
- [ ] `agentQueued` 수신 시 대기 상태(Queued) 표시

**구현 상태**: `CommandBar.tsx` 완료. WS `runAgent`/`stopAgent` 이벤트 정의 확인 (`@radar/shared` events.ts). 서버측 핸들러 연결은 E2E 테스트에서 검증 필요.

---

### 10.4 Feature 3 — 결과 스트리밍

**User Story**: 파워유저로서, 에이전트 작업 중 실시간 출력을 보고, 완료 시 결과 요약을 확인하고 싶다.

**성공 기준**:
- [ ] `agentStream` chunk가 LogPanel에 실시간 append됨 (새 chunk마다 자동 스크롤)
- [ ] 에이전트 선택 → LogPanel 즉시 전환 (사용자 지연 없음)
- [ ] `agentDone` 수신 시 `completedResults`에 결과 저장 + `completedAgents` Set에 agentId 추가 → 해당 에이전트 카드에 완료 칩 표시: `✓ 완료 | {tokens} tokens | ${cost} | {duration}s` — 표시 조건: `completedAgents.has(agent.id)` (isDone) + `status !== 'working'`. 칩 상세 데이터는 `completedResults.find(r => r.agentId === agent.id)`로 조회 (`AgentResult` 타입 기준, tokensUsed/costUsd/duration 모두 표시). dismiss 후 `completed=undefined` 상태에서도 `{completed && ...}` 단락 평가로 안전하게 처리됨 — 이 경우 "✓ 완료" 텍스트만 표시
- [ ] LogPanel 에이전트 미선택 시 "Select an agent to view logs" 빈 상태 표시

**구현 상태**: `LogPanel.tsx` + `CompletionToast.tsx` 완료. `AgentsPage.tsx`에서 선택 에이전트 → LogPanel 연결 완료. 완료 칩: `completedAgents` Set(표시 여부) + `completedResults` 배열(상세 데이터) 이중 방식으로 구현. `tokensUsed` + `costUsd` + `duration` 표시 (`AgentResult` 타입 기준). 빌드 0 errors 통과 (2026-04-07). ⚠️ dismiss 후 `completed` undefined 접근 버그 미수정 — 서진 확인 필요.

> **참고**: "선택 → LogPanel 전환 100ms 이내" 수치 기준 삭제. React 상태 변경 리렌더링이므로 "즉시 전환 (사용자 지연 없음)"으로 대체.

---

### 10.5 Feature 4 — 상태별 색상 시각 구분

**User Story**: 파워유저로서, 에이전트 상태를 색상만으로 즉시 구분하고 싶다.

**상태별 색상 명세** (CSS 변수 기준 — `theme/variables.css` 정의값):

| Status | 텍스트/아이콘 색상 (CSS 변수) | 카드 배경 색상 | 의미 |
|--------|--------------------------|--------------|------|
| `idle` | `var(--status-idle)` (초록 계열) | `transparent` | 대기 중 |
| `working` | `var(--status-working)` (파랑 계열) + 펄싱 애니메이션 | `rgba(74, 158, 255, 0.05)` | 작업 중 |
| `error` | `var(--status-error)` (빨강 계열) | `rgba(248, 113, 113, 0.05)` | 오류 |
| `queued` | `var(--status-queued)` (노랑 계열) | `rgba(251, 191, 36, 0.05)` | 대기열 |

**성공 기준**:
- [ ] 4가지 상태가 색상만으로 즉시 구분 가능
- [ ] `working` 상태 배지에 펄싱 애니메이션 적용 (CSS keyframe)
- [ ] 색상 상수는 컴포넌트 내 인라인 스타일로 정의 (별도 CSS 파일 없음)

**레이아웃 수치** (AgentsPage):
- 좌우 분할 비율: `1/3 (AgentListView) : 2/3 (LogPanel)`
- 패널 간 간격: `gap: 16px`
- 각 패널 내부 패딩: `padding: 12px`

**구현 상태**: `STATUS_COLORS`(CSS 변수 방식으로 `variables.css`와 통일), `DONE_CHIP_STYLE`, `LAYOUT` 상수 `AgentsPage.tsx`에 적용 완료 (Meeting #14 execution). `AgentStatus` 리터럴 `idle | working | error | queued` 타입 일치 확인. 상태 조회 시 `statuses[agent.id] ?? 'idle'` fallback 처리 포함. 빌드 0 errors 통과 (2026-04-07).

---

### 10.6 Out of Scope (Phase 1)

Phase 1에서 **구현하지 않는** 항목. 요청이 있어도 Phase 1 내 추가하지 않는다.

| 항목 | 이동 Phase | 제외 이유 |
|------|-----------|----------|
| 90초 온보딩 플로우 | Phase 1.5 | MVP 핵심 루프와 독립적. 초기 사용자 피드백 수집 후 설계 |
| 활동 타임라인 `/activity` | Phase 1.5 | SQLite 데이터는 Phase 1부터 쌓임. UI는 데이터 축적 후 |
| 에이전트 클릭 → 인라인 상세 패널 | Phase 1.5 | AgentsPage 리스트 뷰로 충분히 대체 가능 |
| 승인 모달 (ApprovalModal) | Phase 1.5 | `approvalRequest` WS 이벤트 수신 구현 후 진행 |
| 설정 페이지 `/settings` | Phase 1.5 | `.env` 파일로 충분 |
| 사용 통계 (recharts) | Phase 2 | 데이터 축적 필요 + recharts 도입 별도 판단 |
| 프로젝트 관리 보드 (칸반) | Phase 2 | UI 설계 별도 필요 |
| 파이프라인 시각화 (@xyflow/react) | Phase 3 | 라이브러리 선택 + 별도 설계 필요 |
| OfficePage (2.5D Canvas) | Phase 2 | AgentsPage 에이전트 상태 연결 검증 후 진행 |

---

## 11. Implementation Guide

### 11.1 Implementation Order

1. [ ] **M0**: 모노레포 보일러플레이트 (turbo, tsconfig, packages)
2. [ ] **M1**: shared 패키지 — 타입 정의
3. [ ] **M2**: server 기반 — Fastify + WebSocket + 토큰 인증
4. [ ] **M3**: server 파서 — .claude/ 디렉토리 파싱
5. [ ] **M4**: server CLI — AgentProcessPool + cli-runner
6. [ ] **M5**: client 셸 — DashboardShell + Sidebar + 라우팅 + 테마
7. [ ] **M6**: client 오피스 — 게임엔진 이식 + OfficePage
8. [ ] **M7**: client 개요 — OverviewPage + stat cards
9. [ ] **M8**: client 커맨드바 — CommandBar + useWebSocket 연동
10. [ ] **M9**: client 리스트뷰 — AgentListView + 뷰 전환
11. [ ] **M10**: 통합 — 전체 작업 루프

### 11.2 Phase별 모듈

| Phase | Modules | 결과물 |
|-------|---------|--------|
| Phase 0 | M0, M1, M2, M3 | 빌드 + CLI 통신 프로토타입 |
| Phase 1 | M4~M10 | MVP: 오피스 + 작업 루프 |

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | Turns |
|--------|-----------|-------------|:-----:|
| 모노레포 + 타입 | `module-0` | turbo, shared 타입, tsconfig | 20 |
| 서버 기반 | `module-1` | Fastify, WS, 인증, SQLite | 30 |
| 서버 파서+CLI | `module-2` | .claude/ 파서, AgentProcessPool | 30 |
| 클라이언트 셸 | `module-3` | DashboardShell, Sidebar, 라우팅, 테마 | 25 |
| 오피스 뷰 | `module-4` | 게임엔진 이식, OfficePage | 35 |
| 개요+커맨드바 | `module-5` | OverviewPage, CommandBar, 리스트뷰 | 30 |
| 통합 | `module-6` | 전체 루프 연결, 버그 수정 | 25 |

#### Recommended Session Plan

| Session | Scope | Turns |
|---------|-------|:-----:|
| 1 | `--scope module-0` 모노레포 + 타입 | 20 |
| 2 | `--scope module-1` 서버 기반 | 30 |
| 3 | `--scope module-2` 파서 + CLI | 30 |
| 4 | `--scope module-3` 클라이언트 셸 | 25 |
| 5 | `--scope module-4` 오피스 뷰 | 35 |
| 6 | `--scope module-5` 개요 + 커맨드바 | 30 |
| 7 | `--scope module-6` 통합 | 25 |
| 8 | Check + Report | 20 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-30 | Plan 기반 초안. Option B(Monorepo) 선택. | user |
| 0.2 | 2026-03-31 | Paperclip 재분석 반영. sessions 테이블 확장(project_tag, input/output tokens, cost_usd), activity_log 테이블 추가, ActivityEntry/CostSummary 타입, approvalRequest WS 이벤트, /api/stats/costs + /api/activity 엔드포인트, ApprovalModal/TokenBudgetBadge/ActivityPage 컴포넌트 추가. | user |
| 0.3 | 2026-04-07 | Section 10 추가 — Phase Scope & Success Criteria. Phase 1/1.5/2/3 경계 확정. 핵심 3기능(에이전트 목록+상태, 에이전트 실행, 결과 스트리밍) 성공 기준 명세. 코드 실제 구현 상태 반영 (AgentsPage 스캐폴드 단계 명시). | user |
