# Paperclip vs Radar Agent Office — 비교 분석

> **작성일**: 2026-03-30
> **Paperclip 버전**: v0.3.1 (master, GitHub Stars: ~40,000)
> **Radar Agent Office 버전**: v0.1.0 (Planning/Design 단계)

---

## 1. 프로젝트 개요 비교

| 항목 | Paperclip | Radar Agent Office |
|------|-----------|-------------------|
| **목적** | "Zero-human company" 오케스트레이션 — AI 에이전트 팀으로 자율 회사를 운영하는 컨트롤 플레인 | Claude Code 멀티에이전트 시스템의 시각화 + 작업 실행 통합 대시보드 |
| **핵심 메타포** | **회사 (Company)** — 조직도, 예산, 거버넌스, 이사회 | **오피스 (Office)** — 2.5D 픽셀아트 가상 사무실, 에이전트 관제 |
| **타겟 유저** | 멀티에이전트 파워유저, AI 회사 운영자, 1인 창업자 | 1차: Claude Code 파워유저, 2차: AI 관심 개발자, 3차: 비개발자 |
| **라이선스** | MIT | (미정, 오픈코어 예정) |
| **기술스택** | TypeScript, Express, React+Vite, PostgreSQL (PGlite/embedded), Drizzle ORM, Tailwind, pnpm monorepo | TypeScript, Fastify, React+Vite, SQLite (better-sqlite3), Zustand, CSS Modules, Turborepo monorepo |
| **상태** | **프로덕션** — v0.3.1 릴리스, 40K+ GitHub Stars, 활발한 커뮤니티 | **계획/설계 단계** — Plan + Design 문서 완료, 코드 미작성 |
| **에이전트 지원** | 멀티벤더: Claude Code, Codex, Cursor, OpenClaw, OpenCode, Pi, Gemini, Hermes, HTTP, Process | Claude Code 전용 (Phase 3+에서 멀티벤더 검토) |
| **배포 모델** | Self-hosted, 로컬 + Docker + Cloud (Vercel/Supabase) | 로컬 전용 (127.0.0.1 바인딩) |
| **멀티 회사** | 1 인스턴스에 무제한 회사 (완전 격리) | 단일 워크스페이스 |
| **모바일** | Mobile Ready (반응형 UI, MobileBottomNav 컴포넌트) | Out of Scope (데스크톱 우선) |

---

## 2. 기능 매트릭스

### 2.1 에이전트 관리

| 기능 | Paperclip | Radar |
|------|:---------:|:-----:|
| 에이전트 CRUD (생성/수정/삭제) | O | 계획 (Phase 1) |
| 에이전트 상태 실시간 표시 (idle/working/error) | O | 계획 (Phase 1) |
| 에이전트 일시정지/재개 | O | 미계획 |
| 에이전트 종료 (terminate) | O | 미계획 |
| 에이전트별 어댑터 설정 | O (10+ 어댑터) | X (CLI subprocess만) |
| 에이전트 역할/직함 설정 | O | O (.claude/ 파싱) |
| 에이전트 아이콘/아바타 | O (커스텀 아이콘) | O (픽셀아트 캐릭터) |
| 에이전트 상세 페이지 | O (AgentDetail) | 계획 (Phase 1, 인라인 패널) |
| 에이전트 스킬 관리 | O (Company Skills, Adapter Skills) | X (.claude/ 스킬 읽기 전용) |
| 에이전트 인증 (API Key, JWT) | O | X (서버 토큰만) |
| 에이전트 초대/온보딩 | O (InviteLanding, Join) | X |

### 2.2 조직 구조

| 기능 | Paperclip | Radar |
|------|:---------:|:-----:|
| 조직도 (Org Chart) | O (전용 페이지 + SVG 렌더링) | X |
| 보고 체계 (reports-to) | O | X |
| 부서별 분류 | 역할 기반 (CEO/CTO/Engineer 등) | O (dev/review/ops/biz 등) |
| CEO 에이전트 | O (기본 템플릿 제공) | X |
| 위임 체인 (delegation chain) | O | X |
| 크로스팀 작업 할당 | O (규칙 기반) | X |

### 2.3 작업 관리

| 기능 | Paperclip | Radar |
|------|:---------:|:-----:|
| 이슈/작업 CRUD | O (Issues, Sub-issues) | 계획 (Phase 2, 칸반) |
| 작업 계층 (Initiative > Project > Milestone > Issue) | O | X (플랫 세션) |
| 칸반 보드 | O (KanbanBoard 컴포넌트) | 계획 (Phase 2) |
| 목표 추적 (Goals) | O (전용 페이지) | X |
| 프로젝트 관리 | O (Projects, ProjectDetail) | 계획 (Phase 2) |
| 라벨 시스템 | O | X |
| 우선순위 시스템 | O (PriorityIcon) | X |
| 작업 코멘트/스레드 | O (CommentThread, IssueComments) | X |
| 작업 자동 할당 | O (atomic checkout) | 계획 (Phase 2) |
| 작업 문서 (issue documents) | O (IssueDocumentsSection) | X |
| 이슈 첨부파일 | O (IssueAttachments) | X |
| 작업 Work Products | O (issue_work_products) | X |
| Inbox (할당된 작업 알림) | O (Inbox 페이지, InboxBadge) | X |

### 2.4 하트비트/실행

| 기능 | Paperclip | Radar |
|------|:---------:|:-----:|
| 스케줄 기반 실행 (heartbeat) | O (cron 기반) | X |
| 이벤트 기반 트리거 | O (task assignment, @-mention) | X |
| 수동 실행 (커맨드바) | X (이슈 기반) | 계획 (Phase 1) |
| 실시간 스트리밍 (에이전트 출력) | O (LiveRunWidget, Transcript) | 계획 (Phase 1, WebSocket) |
| 세션 지속성 (재부팅 후 복구) | O (agent_task_sessions) | 계획 (Phase 1, SQLite) |
| 동시 실행 제한 | X (직접 관리 불필요) | O (p-limit, max=4) |
| Routines (정기 작업) | O (Routines, ScheduleEditor) | X |

### 2.5 비용/예산

| 기능 | Paperclip | Radar |
|------|:---------:|:-----:|
| 토큰/비용 추적 (per agent) | O | X (기본 tokensUsed만) |
| 토큰/비용 추적 (per task) | O | X |
| 토큰/비용 추적 (per project) | O | X |
| 토큰/비용 추적 (per company) | O | X |
| 예산 정책 (hard ceiling) | O (budget_policies, auto-pause) | X |
| 예산 알림 (soft alert) | O (budget_incidents) | X |
| 비용 대시보드 | O (Costs 페이지, BillerSpendCard) | 계획 (Phase 2, 기본 차트) |
| 구독 쿼터 모니터링 | O (ClaudeSubscriptionPanel, QuotaBar) | X |
| 빌링 코드 (cross-team 비용 귀속) | O | X |
| 재무 이벤트 (finance events) | O | X |

### 2.6 거버넌스/승인

| 기능 | Paperclip | Radar |
|------|:---------:|:-----:|
| 이사회(Board) 거버넌스 | O (핵심 기능) | X |
| 승인 게이트 (hiring, strategy) | O (Approvals, ApprovalDetail) | X |
| 에이전트 구성 리비전 추적 | O (agent_config_revisions) | X |
| 감사 로그 (activity log) | O (Activity 페이지, ActivityRow) | X |
| 권한 관리 (RBAC) | O (principal_permission_grants) | X |
| 시크릿 관리 (Secrets) | O (암호화 저장, 버전 관리) | X |

### 2.7 UI/시각화

| 기능 | Paperclip | Radar |
|------|:---------:|:-----:|
| 대시보드 (시스템 개요) | O (Dashboard 페이지) | 계획 (Phase 1) |
| 조직도 시각화 | O (OrgChart 페이지, SVG) | X |
| 에이전트 오피스 (2.5D 픽셀아트) | **X** | **O (핵심 차별점)** |
| 칸반 보드 | O | 계획 (Phase 2) |
| 활동 차트 | O (ActivityCharts) | 계획 (Phase 2) |
| 커맨드 팔레트 | O (CommandPalette) | 계획 (Phase 1, CommandBar) |
| 온보딩 위자드 | O (OnboardingWizard) | 계획 (Phase 1) |
| 다크 테마 | O (ThemeContext) | 계획 (Phase 0) |
| 파이프라인 시각화 (노드 그래프) | X | 계획 (Phase 3) |
| 에이전트 맵/아키텍처 뷰 | X | 계획 (Phase 3) |
| 디자인 가이드 | O (DesignGuide 페이지) | X |
| Markdown 에디터 | O (MDXEditor 통합) | X |
| 말풍선 (SpeechBubble) | X | **O (게임적 요소)** |
| 실시간 로그 패널 | O (RunTranscriptView) | 계획 (Phase 1) |
| 브레드크럼 네비게이션 | O (BreadcrumbBar) | X |

### 2.8 플러그인/확장

| 기능 | Paperclip | Radar |
|------|:---------:|:-----:|
| 플러그인 시스템 | O (SDK, manifest, lifecycle, UI 기여) | X |
| 플러그인 SDK | O (@paperclipai/plugin-sdk) | X |
| 플러그인 매니저 UI | O (PluginManager, PluginSettings) | X |
| 플러그인 예제 | O (hello-world, file-browser, kitchen-sink) | X |
| 커스텀 어댑터 등록 | O | X |

### 2.9 인프라/배포

| 기능 | Paperclip | Radar |
|------|:---------:|:-----:|
| Docker 지원 | O (Dockerfile, docker-compose) | X |
| CLI 도구 | O (npx paperclipai onboard) | X |
| CI/CD 파이프라인 | O (GitHub Actions 6개) | 계획 (Phase 0) |
| E2E 테스트 | O (Playwright) | 미계획 |
| 유닛 테스트 | O (Vitest, 100+ 테스트 파일) | 계획 (Vitest) |
| DB 마이그레이션 시스템 | O (Drizzle, 45+ 마이그레이션) | X (SQLite 단순 스키마) |
| 회사 임포트/엑스포트 | O (ZIP 패키징, 시크릿 스크러빙) | X |
| 릴리스 자동화 | O (release scripts, changelog) | X |
| S3 스토리지 | O | X |
| 멀티유저 인증 | O (Better Auth, CLI auth) | X (단일 토큰) |

---

## 3. 아키텍처 비교

### 3.1 모노레포 구조

| 항목 | Paperclip | Radar Agent Office |
|------|-----------|-------------------|
| **도구** | pnpm workspace | Turborepo |
| **패키지 수** | ~15+ (server, ui, db, shared, adapter-utils, 10+ adapters, plugin-sdk, plugin examples, cli) | 3 (client, server, shared) |
| **공유 패키지** | `@paperclipai/shared` (types, validators, constants, API paths) | `@radar/shared` (types만) |
| **DB 패키지** | `@paperclipai/db` (독립 패키지, Drizzle schema + migrations) | server 내부 db/ 폴더 |
| **어댑터 패키지** | 각 어댑터가 독립 패키지 (server/cli/ui 3분할) | 없음 (CLI subprocess 직접) |

### 3.2 백엔드 구조

| 항목 | Paperclip | Radar Agent Office |
|------|-----------|-------------------|
| **프레임워크** | Express | Fastify |
| **라우트 수** | ~20+ (agents, issues, projects, goals, costs, approvals, activity, companies, secrets, plugins, routines, assets, dashboard, access, health, etc.) | ~10 (workspace, agent, stats, sessions) |
| **서비스 레이어** | 30+ 서비스 (각 도메인별 독립 서비스) | 3 서비스 (agent-pool, cli-runner, workspace-scanner) |
| **미들웨어** | auth, board-mutation-guard, error-handler, logger, private-hostname-guard, validate | 토큰 인증, 레이트 리밋 |
| **인증** | Better Auth (OAuth, 세션), Agent JWT, Board API Key, CLI Auth | 일회성 토큰 (crypto.randomUUID) |
| **실시간** | WebSocket (live-events-ws.ts) | WebSocket (Fastify native) |
| **스토리지** | Local disk + S3 (provider-registry 패턴) | 없음 |
| **시크릿 관리** | 암호화 저장 (local-encrypted-provider), 외부 provider 확장 가능 | 없음 |

### 3.3 프론트엔드 구조

| 항목 | Paperclip | Radar Agent Office |
|------|-----------|-------------------|
| **프레임워크** | React 19 + Vite | React + Vite |
| **스타일링** | Tailwind CSS + Radix UI + shadcn/ui | CSS Variables + CSS Modules |
| **상태 관리** | TanStack React Query (서버 상태) + Context | Zustand |
| **라우팅** | react-router-dom v7 | react-router-dom |
| **UI 컴포넌트** | shadcn/ui (button, card, dialog, dropdown, input, etc.) | 커스텀 (AgentCard, SpeechBubble, StatusBadge) |
| **차트** | 자체 ActivityCharts | recharts (Phase 2) |
| **에디터** | MDXEditor (Markdown) | 없음 |
| **칸반** | @dnd-kit/core + @dnd-kit/sortable | 미정 |
| **페이지 수** | ~35+ 페이지 | 5 페이지 (계획) |
| **컴포넌트 수** | ~80+ 컴포넌트 | ~15 컴포넌트 (계획) |
| **게임 엔진** | 없음 | GameEngine, TileMap, Character, Camera, Pathfinder (~2,400줄) |

### 3.4 DB

| 항목 | Paperclip | Radar Agent Office |
|------|-----------|-------------------|
| **DBMS** | PostgreSQL (PGlite embedded for dev, Docker/Supabase for prod) | SQLite (better-sqlite3) |
| **ORM** | Drizzle ORM | 직접 SQL |
| **스키마 테이블** | 45+ 테이블 (companies, agents, issues, goals, projects, approvals, budgets, plugins, costs, routines, secrets, assets, etc.) | 2 테이블 (sessions, daily_stats) |
| **마이그레이션** | 45+ 마이그레이션 파일 (자동 생성) | 없음 (직접 CREATE TABLE) |

### 3.5 실시간 통신

| 항목 | Paperclip | Radar Agent Office |
|------|-----------|-------------------|
| **프로토콜** | WebSocket | WebSocket |
| **이벤트 구조** | Live Events (전사적 상태 변경 브로드캐스트) | 6종 이벤트 (agentStream, agentQueued, agentDone, statusUpdate, runAgent, stopAgent) |
| **인증** | 세션 기반 + API Key | query param token |
| **하트비트** | 서버 자체 관리 | 30초 ping/pong |

### 3.6 인증

| 항목 | Paperclip | Radar Agent Office |
|------|-----------|-------------------|
| **사용자 인증** | Better Auth (OAuth, email, 세션) | 일회성 토큰 |
| **에이전트 인증** | JWT (agent_api_keys, 에이전트별 키 생성) | 없음 (서버가 직접 subprocess) |
| **CLI 인증** | CLI auth challenge (cli_auth_challenges) | 없음 |
| **배포 모드** | local_trusted (인증 없음) + authenticated (로그인 필수) | local only (127.0.0.1) |

---

## 4. Paperclip에 있고 우리에 없는 것 (Gap)

### High Priority — Phase 0~1에 반영 권장

| Gap | Paperclip 구현 | 적용 제안 | Phase |
|-----|---------------|----------|-------|
| **멀티 어댑터 아키텍처** | 10+ 어댑터, 각각 server/cli/ui 3분할 독립 패키지 | 어댑터 인터페이스 (invoke/status/cancel) 정의. Phase 1은 Claude Code만 구현하되 확장 가능한 구조로 설계 | Phase 0 |
| **작업 계층 구조** | Initiative > Project > Milestone > Issue > Sub-issue, 모든 작업이 목표에 연결 | 최소한 Project > Task 2단계 계층은 Phase 1에 도입. "왜 이 작업을 하는가" 추적 | Phase 1 |
| **Atomic Task Checkout** | 단일 할당 + DB 레벨 원자적 체크아웃, 중복 작업 방지 | 에이전트 동시 작업 시 충돌 방지 로직 필수 | Phase 1 |
| **비용 추적 (per agent/task)** | cost_events 테이블, 에이전트/작업/프로젝트/회사 수준 집계 | Claude Code --output-format stream-json에서 토큰 수 파싱, sessions 테이블에 기록 | Phase 1 |
| **승인 게이트** | approvals 테이블, 이사회 승인 후 실행 | 위험 작업(파일 삭제, 대규모 변경) 전 사용자 승인 확인 플로우 | Phase 1 |
| **Activity Log** | 모든 뮤테이션 이벤트 기록, Activity 페이지 | 에이전트 작업/상태 변경 히스토리 기록 + 타임라인 뷰 | Phase 1 |

### Medium Priority — Phase 2에 반영 권장

| Gap | Paperclip 구현 | 적용 제안 | Phase |
|-----|---------------|----------|-------|
| **예산 정책 (hard ceiling)** | budget_policies, 한도 초과 시 auto-pause | 일일/월별 토큰 한도 설정, 초과 시 에이전트 자동 정지 | Phase 2 |
| **코멘트/스레드** | issue_comments, CommentThread | 작업에 코멘트 추가, 에이전트 간/사용자-에이전트 간 대화 | Phase 2 |
| **멀티유저 인증** | Better Auth, OAuth, 세션 관리 | 팀 공유 시나리오 대비 | Phase 2 |
| **플러그인 시스템 기초** | SDK, manifest, lifecycle, event bus | 최소한 플러그인 인터페이스 정의 + 이벤트 훅 시스템 | Phase 2 |
| **회사/프로젝트 임포트/엑스포트** | ZIP 패키징, 시크릿 스크러빙, collision handling | 에이전트 설정 + 워크스페이스 프리셋 내보내기/불러오기 | Phase 2 |
| **구독 쿼터 모니터링** | Claude/Codex 구독 잔여량 표시 | Claude Code 구독 잔여량/사용량 프록시 표시 | Phase 2 |
| **Markdown 에디터** | MDXEditor 통합, 작업 문서 편집 | 작업 설명/결과 Markdown 에디터 | Phase 2 |

### Low Priority — Phase 3+ 검토

| Gap | Paperclip 구현 | 적용 제안 | Phase |
|-----|---------------|----------|-------|
| **Docker 배포** | Dockerfile, docker-compose | 원클릭 Docker 배포 | Phase 3 |
| **CLI 도구** | npx paperclipai onboard, doctor, configure | npx radar-office init 같은 설치 CLI | Phase 3 |
| **DB 마이그레이션 시스템** | Drizzle 45+ migrations | Phase 3에서 SQLite → PostgreSQL 전환 시 도입 | Phase 3 |
| **에이전트 초대 시스템** | InviteLanding, 초대 링크 | 원격 에이전트 연결 (클라우드 배포 시) | Phase 3+ |
| **시크릿 관리** | 암호화 저장, 버전 관리 | API 키 등 민감 정보 안전 저장 | Phase 3 |
| **S3 스토리지** | 파일 업로드/다운로드, CDN | 작업 산출물 영구 저장 | Phase 3+ |
| **E2E 테스트** | Playwright 테스트 | Playwright 또는 Cypress | Phase 3 |
| **조직도 시각화** | OrgChart SVG 페이지 | 에이전트 보고 체계 시각화 (오피스 뷰와 보완) | Phase 3 |

---

## 5. 우리에 있고 Paperclip에 없는 것 (차별점)

### 5.1 2.5D 픽셀아트 에이전트 오피스 (핵심 차별점)

Paperclip은 텍스트/카드 기반 대시보드. Radar는 **게임적 시각화**를 통해 에이전트의 상태를 직관적이고 감성적으로 표현:

- **GameEngine** (~2,400줄): Canvas 기반 2.5D 아이소메트릭 렌더링
- **TileMap**: 부서별 구역이 있는 가상 사무실
- **Character**: 에이전트를 픽셀아트 캐릭터로 표현, 상태에 따른 애니메이션
- **Pathfinder**: 캐릭터 이동 경로 탐색
- **Camera**: 줌/팬 인터랙션
- **SpeechBubble**: 에이전트가 현재 작업 내용을 말풍선으로 표시

이것은 Paperclip의 비즈니스 지향 UI와 완전히 다른 접근. "보는 재미"와 "감성적 체류 동기"를 제공하여 사용자 참여도를 높이는 전략.

### 5.2 .claude/ 디렉토리 네이티브 파싱

Paperclip은 자체 에이전트 설정 시스템(DB 저장)을 사용. Radar는 **기존 Claude Code 프로젝트의 .claude/ 디렉토리를 직접 파싱**하여:

- agents, skills, hooks, rules를 자동 인식
- 기존 Claude Code 워크플로우를 변경 없이 시각화
- Claude Code 사용자의 **제로 설정 온보딩** 가능

### 5.3 커맨드바 기반 직접 실행

Paperclip은 이슈를 생성하고 에이전트 하트비트를 통해 간접 실행. Radar는 **커맨드바에서 에이전트를 직접 지목하여 즉시 실행**:

- 모든 페이지 하단 고정 CommandBar
- 에이전트 선택 → 자연어 프롬프트 → 즉시 실행
- 결과 실시간 스트리밍 + 승인/수정/재지시

이것은 "작업 관리 도구"가 아닌 "작업 실행 도구"로서의 차별점.

### 5.4 파이프라인 시각화 (Phase 3)

에이전트 체인을 **인터랙티브 노드 그래프**로 시각화:
- @xyflow/react 기반 드래그 가능 노드
- 에이전트 간 데이터 흐름 시각화
- Paperclip에는 없는 기능

### 5.5 경량성과 낮은 진입장벽

| 항목 | Paperclip | Radar |
|------|-----------|-------|
| DB 요구사항 | PostgreSQL (embedded PGlite 또는 Docker) | SQLite (설치 불필요) |
| 패키지 수 | ~15+ | 3 |
| 의존성 | heavy (Express, Drizzle, Better Auth, PGlite, AWS SDK 등) | light (Fastify, better-sqlite3, p-limit) |
| 첫 실행까지 | `npx paperclipai onboard` (~수분, DB 초기화) | `npm run dev` (즉시) |

### 5.6 개발자 모드/간편 모드 토글 (Phase 2)

- **개발자 모드**: 상세 로그 + diff 뷰 + 도구 호출 추적
- **간편 모드**: 요약 + 자연어 결과

Paperclip은 progressive disclosure를 목표로 하지만 전용 모드 토글은 없음.

---

## 6. Design 문서 업데이트 제안

### 6.1 `web-dashboard.design.md` 수정 사항

#### 섹션 2.1 — System Architecture에 추가

```
추가 항목: 어댑터 아키텍처
- AdapterInterface { invoke(), status(), cancel() } 정의
- Phase 1: ClaudeCodeAdapter만 구현
- Phase 3+: Codex, Cursor, HTTP, Process 어댑터 추가
- 어댑터별 server/ui 분리 (Paperclip 패턴 참고)
```

#### 섹션 3.1 — Core Types에 추가

```typescript
// 추가: Task 계층 타입
interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'done' | 'blocked';
  assigneeAgentId?: string;
  parentTaskId?: string;    // 작업 계층
  projectId?: string;
  priority: 'urgent' | 'high' | 'medium' | 'low';
  createdAt: string;
  completedAt?: string;
  tokensUsed?: number;
  costUsd?: number;
}

// 추가: 비용 추적 타입
interface CostEvent {
  id: string;
  agentId: string;
  sessionId: string;
  taskId?: string;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
  timestamp: string;
}

// 추가: 승인 타입
interface Approval {
  id: string;
  type: 'destructive_action' | 'large_change' | 'budget_override';
  status: 'pending' | 'approved' | 'rejected';
  requestedBy: string;
  description: string;
  createdAt: string;
}
```

#### 섹션 3.2 — SQLite Schema에 추가

```sql
-- 추가: 작업 테이블
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo',
  assignee_agent_id TEXT,
  parent_task_id TEXT REFERENCES tasks(id),
  project_id TEXT,
  priority TEXT NOT NULL DEFAULT 'medium',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT,
  tokens_used INTEGER,
  cost_usd REAL
);

-- 추가: 비용 이벤트
CREATE TABLE cost_events (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  session_id TEXT NOT NULL REFERENCES sessions(id),
  task_id TEXT REFERENCES tasks(id),
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  cost_usd REAL NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 추가: 활동 로그
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,        -- 'agent_started', 'task_completed', 'approval_requested', etc.
  agent_id TEXT,
  entity_id TEXT,
  entity_type TEXT,          -- 'session', 'task', 'approval'
  description TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_agent_id);
CREATE INDEX idx_cost_events_agent ON cost_events(agent_id);
CREATE INDEX idx_activity_log_type ON activity_log(type);
CREATE INDEX idx_activity_log_time ON activity_log(timestamp);
```

#### 섹션 4.1 — REST Endpoints에 추가

```
추가 엔드포인트:
  POST /api/tasks              작업 생성
  GET  /api/tasks              작업 목록 (필터: status, assignee, project)
  PATCH /api/tasks/:id         작업 업데이트
  DELETE /api/tasks/:id        작업 삭제
  GET  /api/costs/summary      비용 요약 (agent별, 기간별)
  GET  /api/costs/events       비용 이벤트 상세
  GET  /api/activity           활동 로그 (pagination)
  POST /api/approvals          승인 요청
  PATCH /api/approvals/:id     승인/거절
```

#### 섹션 4.3 — WebSocket Protocol에 추가

```
추가 이벤트:
  → costUpdate       비용 이벤트 발생 시 실시간 전달
  → taskUpdate       작업 상태 변경
  → approvalRequest  승인 요청 알림
  → activityEvent    활동 로그 실시간 알림
```

### 6.2 `web-dashboard.plan.md` 수정 사항

#### 섹션 3.1 — Functional Requirements에 추가

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-13 | 어댑터 인터페이스: invoke/status/cancel 패턴으로 에이전트 실행 추상화 | High | 0 |
| FR-14 | 작업 계층: Project > Task 최소 2단계, 작업-목표 연결 | High | 1 |
| FR-15 | 비용 추적: 에이전트별/세션별 토큰 사용량 및 USD 비용 기록 | High | 1 |
| FR-16 | 활동 로그: 모든 에이전트 상태 변경/작업 완료 이벤트 기록 + 타임라인 뷰 | Medium | 1 |
| FR-17 | 승인 게이트: 위험 작업 전 사용자 확인 플로우 | Medium | 1 |
| FR-18 | 예산 정책: 일일/월별 토큰 한도 설정, 초과 시 auto-pause | Medium | 2 |
| FR-19 | 플러그인 인터페이스: 이벤트 훅 + UI 기여 최소 구조 | Low | 3 |

#### 섹션 2.2 — Out of Scope 수정

```
삭제: "멀티 벤더 지원 (Phase 3+ 검토)"
변경: "멀티 벤더 지원 — 어댑터 인터페이스는 Phase 0에서 설계, 추가 어댑터 구현은 Phase 3+"
```

---

## 7. 결론 및 권장사항

### 7.1 핵심 발견

1. **Paperclip은 "회사 운영 플랫폼"이고, Radar는 "에이전트 작업 도구"다.**
   Paperclip의 핵심은 조직도/거버넌스/예산/승인이고, Radar의 핵심은 시각화/직접실행/접근성이다. 두 프로젝트는 비슷한 영역에서 **다른 추상화 레벨**을 타겟한다.

2. **Paperclip은 이미 프로덕션 수준이다.**
   45+ DB 테이블, 100+ 테스트 파일, 10+ 어댑터, 40K Stars. 기능 범위에서 정면 경쟁하면 추격 불가능하다.

3. **Radar의 차별점은 명확하다.**
   2.5D 픽셀아트 오피스, .claude/ 네이티브 파싱, 커맨드바 직접 실행, 경량성. 이것들은 Paperclip이 제공하지 않고 제공할 가능성도 낮은 영역이다.

### 7.2 전략적 권장사항

#### (A) 차별점 극대화 전략 (권장)

Paperclip과 **다른 포지셔닝**을 확고히 하라:

| Paperclip | Radar Agent Office |
|-----------|-------------------|
| 회사 운영 (Company Operations) | **에이전트 관제실 (Agent Control Room)** |
| 이사회/CEO 관점 | **개발자/오퍼레이터 관점** |
| 간접 실행 (이슈 → 하트비트) | **직접 실행 (커맨드바 → 즉시)** |
| 텍스트/카드 UI | **게임적 시각화 (2.5D 오피스)** |
| 헤비웨이트 (PostgreSQL, 15+ 패키지) | **라이트웨이트 (SQLite, 3 패키지)** |

#### (B) 선택적 차용

Paperclip에서 배울 점을 **우리 방식으로** 적용:

1. **어댑터 인터페이스**: Phase 0에서 `AdapterInterface { invoke, status, cancel }` 정의. 무조건 필요.
2. **비용 추적**: Phase 1에서 기본 토큰/비용 기록. 경쟁력의 기반.
3. **작업 계층**: 최소 Project > Task. "왜 이 작업을 하는가"는 에이전트 효과의 핵심.
4. **승인 게이트**: 위험 작업 전 사용자 확인. 안전한 자율성의 핵심.

#### (C) 하지 말아야 할 것

1. **조직도/거버넌스 시스템 구현하지 마라.** Paperclip의 핵심 영역이고 추격 불가.
2. **멀티 회사 지원하지 마라.** 스코프 폭발의 원인. 단일 워크스페이스로 충분.
3. **플러그인 시스템을 서두르지 마라.** Phase 3 이후 검토. 코어가 완성되지 않은 상태에서 확장성은 의미 없음.
4. **Better Auth 같은 풀 인증 시스템 도입하지 마라.** 로컬 단일 사용자로 시작. 멀티유저는 Phase 4+.

### 7.3 보완적 관계 가능성

장기적으로 Radar Agent Office는 **Paperclip의 프론트엔드 대안** 또는 **Paperclip 에코시스템의 시각화 플러그인**으로 포지셔닝할 수 있다. Paperclip이 API를 제공하므로, Radar가 Paperclip 서버에 연결하여 2.5D 오피스 뷰를 제공하는 시나리오도 가능하다.

하지만 현 시점에서는 **독립 제품으로 차별점을 극대화**하는 것이 우선이다.

---

> **요약**: Paperclip은 "AI 회사 운영 컨트롤 플레인"이고, Radar Agent Office는 "AI 팀 관제실 + 작업 도구"다. 정면 경쟁은 비현실적이며, 2.5D 시각화/직접 실행/경량성이라는 차별점을 극대화하되, 어댑터 아키텍처/비용 추적/작업 계층/승인 게이트는 Paperclip에서 배워 Phase 0~1에 반영하라.

---

## 8. 직접 실행 모델 기준 최종 채택 결정 (2026-03-31 재분석)

> **필터 기준**: Radar = "직접 실행 도구" (개발자가 에이전트를 도구처럼 즉시 사용).
> 이 관점에서 Paperclip의 어떤 기능이 실제로 가치 있는가?

### 8.1 채택 결정 (6개)

| # | Paperclip 원본 | Radar 적용 | Phase | 이유 |
|---|----------------|-----------|-------|------|
| **1** | Activity Log | **세션 타임라인 UI** | Phase 1 | 빠른 직접 실행 후 "오늘 뭘 시켰지?" 추적이 핵심 니즈 |
| **2** | cost_events (per agent/task) | **토큰 비용 추적** — session/agent별 집계 + Stats 차트 | Phase 1 | Opus는 고가. "이 기능 수정에 얼마 썼나" 바로 알아야 함 |
| **3** | Approval Gates | **위험 작업 확인 다이얼로그** — 파일 삭제/대규모 변경 감지 시 confirm modal | Phase 1 | 직접 실행 = 빠른 실수. CommandBar에서 위험 작업 감지 후 차단 |
| **4** | Project > Issue 계층 | **프로젝트 태그** — session에 feature 태그 (ex. `auth-refactor`) | Phase 1 | 같은 기능 작업을 여러 세션에 걸쳐 그룹핑해서 보기 |
| **5** | QuotaBar (구독 잔여량) | **누적 토큰 버짓 인디케이터** — CommandBar에 오늘 소비 토큰 표시 | Phase 2 | 빠르게 실행하다 API 한도 초과하기 쉬움, 실시간 가시성 필요 |
| **6** | Atomic Task Checkout | **에이전트 UI 잠금 강화** — 이미 작업 중인 에이전트는 CommandBar에서 선택 비활성화 | Phase 1 | 서버 409는 있으나 UI 레벨 방어 없음 → 같은 파일 충돌 위험 |

### 8.2 스킵 결정 (Radar 모델과 충돌)

| Paperclip 기능 | 스킵 이유 |
|----------------|-----------|
| Heartbeat/schedule 기반 실행 | 직접 실행 모델의 반대 개념. 도입하면 UX 일관성 파괴 |
| Board 거버넌스, RBAC, 이사회 승인 | 1인 개발자에게 오버킬. 포지셔닝 충돌 |
| Issue CRUD + 코멘트 스레드 | Radar는 PM 도구가 아님. 기능 경계 명확히 유지 |
| 멀티 회사/멀티유저 인증 | Phase 4+ 검토 |
| S3 스토리지, 플러그인 SDK | Phase 3+ |
| 조직도 시각화 | 2.5D 오피스가 대체함 |

### 8.3 채택 항목별 구체 구현

#### [1] 세션 타임라인
```sql
-- sessions 테이블에 project_tag 추가
ALTER TABLE sessions ADD COLUMN project_tag TEXT;

-- activity_log 테이블 추가 (경량화 버전)
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,  -- 'agent_started' | 'agent_done' | 'agent_error' | 'agent_stopped'
  agent_id TEXT NOT NULL,
  session_id TEXT REFERENCES sessions(id),
  description TEXT NOT NULL,
  timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_activity_log_time ON activity_log(timestamp);
```
- **UI**: `ActivityPage` — 날짜별 그룹핑, 에이전트 필터, project_tag 필터

#### [2] 토큰 비용 추적
```sql
-- sessions 테이블 확장
ALTER TABLE sessions ADD COLUMN input_tokens INTEGER;
ALTER TABLE sessions ADD COLUMN output_tokens INTEGER;
ALTER TABLE sessions ADD COLUMN cost_usd REAL;

-- 모델별 단가 (서버 config.ts)
const TOKEN_PRICE = {
  'claude-opus-4-6':    { input: 0.000015, output: 0.000075 },
  'claude-sonnet-4-6':  { input: 0.000003, output: 0.000015 },
  'claude-haiku-4-5':   { input: 0.00000025, output: 0.00000125 },
};
```
- **파싱**: `claude --output-format stream-json` → `usage.input_tokens`, `usage.output_tokens`
- **UI**: Stats 페이지 비용 차트 + CommandBar 오른쪽 "오늘 $0.42" 배지

#### [3] 위험 작업 확인 다이얼로그
```typescript
// cli-runner.ts — stream JSON 파싱 중 위험 도구 감지
const DANGEROUS_TOOLS = ['Bash', 'Write'];  // 대규모 변경 가능성
const DANGEROUS_PATTERNS = /rm -rf|git push|DROP TABLE|chmod 777/;

// 위험 감지 시 WebSocket으로 approvalRequest 이벤트 전송
// 클라이언트: ApprovalModal 표시 → 승인/거절 → stopAgent 또는 계속
```
- **UI**: `ApprovalModal` 컴포넌트 — 명령어 미리보기 + 승인/취소 버튼

#### [4] 프로젝트 태그
- CommandBar에 optional `[project tag]` 입력 또는 드롭다운
- `sessions.project_tag` 필드로 필터링
- History 페이지에서 태그별 그룹 보기

#### [5+6] CommandBar 토큰 인디케이터 + 에이전트 잠금
```tsx
// CommandBar.tsx 우측에 추가
<TokenBudgetBadge todayTokens={todayStats.totalTokens} todayCost={todayStats.costUsd} />

// 작업 중인 에이전트 비활성화
<AgentSelector
  agents={agents}
  disabledIds={workingAgents}  // 이미 working 상태인 에이전트 선택 불가
/>
```

### 8.4 설계 문서 반영 범위

| 섹션 | 변경 |
|------|------|
| 3.2 SQLite Schema | `sessions`에 `project_tag`, `input_tokens`, `output_tokens`, `cost_usd` 추가; `activity_log` 테이블 추가 |
| 3.1 Core Types | `ActivityEntry`, `CostSummary` 타입 추가; `Session` 타입 확장 |
| 4.1 REST Endpoints | `GET /api/activity`, `GET /api/stats/costs` 추가 |
| 4.3 WS Protocol | `approvalRequest` 이벤트 추가 |
| 5.3 Component List | `ApprovalModal`, `TokenBudgetBadge`, `ActivityPage` 추가 |
| 11.1 Module Map | M1(shared 타입)에 새 타입 반영, M5(개요+커맨드바)에 비용/잠금/태그 반영 |
