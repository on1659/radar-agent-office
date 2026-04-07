# Radar Agent Office

Claude Code 에이전트 시스템을 시각화하고 직접 작업을 수행하는 웹 기반 통합 대시보드.

## 아키텍처

```text
packages/
├── shared/   # @radar/shared — 공용 타입. 여기서만 타입 정의.
├── server/   # @radar/server — Fastify + WebSocket + SQLite + CLI runner
└── client/   # @radar/client — React 19 + Vite + Zustand + Canvas 게임엔진
```

- **모노레포**: Turborepo + npm workspaces. 빌드 순서: shared → server, client (병렬)
- **의존 방향**: client → shared, server → shared. 역방향 import 절대 금지.
- **DB**: SQLite (better-sqlite3), WAL mode. 스키마는 `packages/server/src/db/` 참조.
  - `sessions` — 에이전트 실행 세션 (프롬프트, 결과, 비용, 토큰)
  - `daily_stats` — 일별 에이전트별 도구 사용 통계
  - `activity_log` — 실시간 활동 로그 (시작/완료/에러/중지)

### shared 타입 모듈 맵

```text
shared/src/
├── agent.ts     → Agent, AgentStatus, Department, ModelType
├── workspace.ts → WorkspaceOverview, Skill, Hook, Rule
├── api.ts       → Session, AgentResult, CostSummary, ActivityEntry
├── events.ts    → ServerEvent (7종), ClientEvent (3종)
└── index.ts     → re-export only
```

### WebSocket 이벤트

```text
ServerEvent: agentStream | agentQueued | agentDone | statusUpdate | workspaceUpdate | approvalRequest | activityEvent
ClientEvent: runAgent | stopAgent | approvalResponse
```

## 행동 원칙

- **추측해서 행동하지 말 것.** 질문에는 답변만. 행동은 명시적 지시가 있을 때만.
  - "이거 왜 안돼?" → 원인 설명만. 프로세스 kill 하지 않음.
  - "어떻게 해?" → 방법 설명만. 실행하지 않음.
  - "해줘", "실행해", "고쳐줘" → 그때 행동.
- **돌이킬 수 없는 동작(프로세스 종료, 파일 삭제, git reset 등)은 반드시 사용자가 지시한 경우에만.**

## 규칙

### DO

- 새 타입은 `packages/shared/src/`에 정의 → `index.ts`에서 re-export
- import는 항상 `@radar/shared`에서. 상대경로로 shared 접근 금지.
- TypeScript strict mode. `any` 대신 `unknown` + 타입 가드.
- WebSocket 이벤트는 `@radar/shared`의 타입 사용. 문자열 리터럴 하드코딩 금지.

### DON'T

- shared에 정의된 타입을 client/server에서 재정의 금지.
- server → client, shared → server/client 방향 import 금지.

> 패키지 특화 규칙은 `.claude/rules/`에 분리되어 있음 (server.md, client.md, game-engine.md).
> 해당 디렉토리 파일 편집 시 자동 로드됨.

## 검증

코드 변경 후 반드시 실행:

```bash
npx tsc --noEmit -p packages/shared/tsconfig.json &&
npx tsc --noEmit -p packages/client/tsconfig.json &&
npx tsc --noEmit -p packages/server/tsconfig.json &&
npm run build
```

- 전체 0 errors 통과해야 작업 완료. 새 warning 추가 금지.
- shared 타입 변경 시: server + client 양쪽 타입체크 필수.

## 실행

```bash
npm run dev    # 서버(:3001) + 클라이언트(:5173) 동시 실행
npm run build  # 전체 빌드
```

- 인증: localhost 접속 시 `/api/auth/token`에서 자동 발급.

### 환경변수 (`.env`)

| 변수 | 기본값 | 설명 |
| ------ | -------- | ------ |
| `PORT` | 3001 | 서버 포트 |
| `AUTH_TOKEN` | (자동생성) | 인증 토큰 |
| `CLAUDE_CLI_PATH` | claude | CLI 바이너리 경로 |
| `MAX_CONCURRENT` | 4 | 동시 에이전트 프로세스 수 |
| `WORKSPACE_ROOT` | . | .claude/ 스캔 대상 디렉토리 |

### 테스트

없음. 타입체크(`tsc --noEmit`) + 빌드(`npm run build`)로 검증.

## 설계 결정

이 결정들은 의도적이다. 뒤집지 말 것.

- **WebSocket-first**: REST 폴링 대비 지연 최소화. 에이전트 상태가 모든 화면에서 즉시 반영되어야 하므로.
- **127.0.0.1 전용**: 로컬 개발 도구. 외부 노출 시 CLI subprocess가 보안 위협이 되므로.
- **인라인 스타일**: CSS 빌드 스텝 제거로 개발 속도 최적화. 1인 개발에서 CSS 모듈은 오버헤드.
- **게임엔진 격리**: game/은 순수 Canvas. React 렌더링 사이클과 분리해야 60fps 유지 가능.
- **SQLite 단일 파일**: 로컬 전용 도구에 ORM/외부 DB는 과잉. better-sqlite3 동기 API가 가장 단순.

## 참조

- 설계: `docs/02-design/features/web-dashboard.design.md`
- 기획: `docs/01-plan/features/web-dashboard.plan.md`
- 패키지 특화 규칙: `.claude/rules/` (server.md, client.md, game-engine.md)
