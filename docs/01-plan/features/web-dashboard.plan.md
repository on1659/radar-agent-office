# Radar Agent Office — Web Dashboard Planning Document

> **Summary**: Claude Code 에이전트 시스템을 시각화하고 직접 작업을 수행하는 웹 기반 통합 대시보드
>
> **Project**: radar-agent-office
> **Version**: 0.1.0
> **Author**: user
> **Date**: 2026-03-30
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | Claude Code 멀티에이전트 시스템은 터미널 기반이라 전체 현황 파악, 에이전트 상태 모니터링, 작업 지시/결과 확인이 분산되어 있음 |
| **Solution** | 웹 기반 풀 대시보드로 에이전트 오피스(2.5D 픽셀아트) + 시스템 개요 + 사용 통계 + 파이프라인 + 프로젝트 관리를 통합 제공 |
| **Function/UX Effect** | 대시보드 하나에서 에이전트 상태 확인, 작업 지시, 진행 관찰, 결과 승인까지 완결. 픽셀아트 오피스로 감성적 체류 동기 제공 |
| **Core Value** | "AI 팀의 가상 오피스 — 코드는 에이전트가, 관제는 당신이" |

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

### 1.1 Purpose

Claude Code 기반 멀티에이전트 시스템을 웹 대시보드로 시각화하고, 대시보드에서 직접 에이전트에게 작업을 지시·관찰·승인할 수 있는 통합 작업 환경을 구축한다.

### 1.2 Background

- **기존 프로젝트**: `claude_team_gui` VS Code Extension으로 픽셀아트 오피스, 회의 시스템 구현 완료
- **전환 동기**: QJC OS Visualizer(퀀텀점프클럽)가 유사 시스템을 웹 기반으로 이미 구축. VS Code Extension은 타겟이 좁고 배포/설치 허들이 높음
- **차별점**: QJC는 자체 전용 모니터링 도구. 우리는 "모니터링 + 작업 실행"이 가능한 범용 통합 작업 환경
- **기존 자산 재사용**: 게임엔진(~2,400줄), UI 컴포넌트(~2,000줄) 파일 복사로 재사용 가능. VS Code 의존 코드(~2,000줄)만 교체

### 1.3 Related Documents

- 10인 에이전트 회의 결과 (2026-03-30, 이 문서에 반영됨)
- 기존 프로젝트: `claude_team_gui` (VS Code Extension)
- 참고: QJC OS Visualizer (https://www.youtube.com/watch?v=ZpdPG8128Vs)

---

## 2. Scope

### 2.1 In Scope (Phase별)

**Phase 0 — 기반 구축 (2주)**
- [ ] 웹 프로젝트 보일러플레이트 (Vite + React + TypeScript)
- [ ] Fastify 백엔드 서버 + WebSocket 설정
- [ ] Claude Code CLI 통신 레이어 프로토타입
- [ ] 보안 기본 설정 (127.0.0.1 바인딩, 토큰 인증, shell:true 제거)
- [ ] 공통 레이아웃/네비게이션 셸 (다크 테마)
- [ ] CI/CD: 빌드-배포 파이프라인 동작 확인

**Phase 1 — MVP: 킬러 화면 + 작업 루프 (4주)**
- [ ] 에이전트 오피스 뷰 (기존 게임엔진 웹 포팅, 픽셀아트 캐릭터)
- [ ] 작업 지시 패널 (커맨드바 — 에이전트 선택 → 프롬프트 → 실행)
- [ ] 에이전트 상태 보드 (idle/working/error 실시간 표시)
- [ ] 작업 로그 뷰어 (실시간 스트리밍)
- [ ] 시스템 개요 간소판 (에이전트 수, 활성 작업, 최근 완료)
- [ ] 90초 온보딩 플로우 (빈 오피스 → 프로젝트 연결 → 에이전트 배치)

**Phase 2 — 시각화 강화 (4주)**
- [ ] 사용 통계 대시보드 (도구 순위, 일별 활동, 토큰 소비 차트)
- [ ] 프로젝트 관리 보드 (칸반 스타일)
- [ ] 에이전트 오피스 ↔ 리스트 뷰 이중 구조
- [ ] 에이전트 클릭 → 인라인 정보 패널

**Phase 3 — 고급 기능 (4주)**
- [ ] 파이프라인 시각화 (노드 그래프, 에이전트 체인)
- [ ] 에이전트 맵 / 시스템 아키텍처 뷰
- [ ] 카탈로그 (스킬/훅/규칙 검색 및 장착)
- [ ] 자동화 규칙 편집기

### 2.2 Out of Scope

- VS Code Extension 유지보수 (아카이브)
- 멀티유저/팀 기능 (향후 Phase 4+)
- 모바일 반응형 (데스크톱 우선)
- 수익화/결제 시스템 (커뮤니티 확보 후)
- 멀티 벤더 지원 (Codex CLI, Gemini CLI — Phase 3+ 검토)

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Phase |
|----|-------------|----------|-------|
| FR-01 | 에이전트 오피스: 2.5D 픽셀아트 캐릭터 부서별 배치 및 실시간 상태 반영 | High | 1 |
| FR-02 | 작업 지시: 대시보드에서 에이전트에게 자연어 프롬프트로 작업 지시 | High | 1 |
| FR-03 | 실시간 스트리밍: 에이전트 작업 진행 상황을 WebSocket으로 실시간 표시 | High | 1 |
| FR-04 | 결과 확인: 작업 결과물 프리뷰 + diff 뷰 + 승인/수정/재지시 | High | 1 |
| FR-05 | 시스템 개요: 에이전트 수, 스킬 수, 훅 수, 활성 작업 수 카드 표시 | High | 1 |
| FR-06 | .claude/ 파싱: 에이전트, 스킬, 훅, 규칙 메타데이터 자동 수집 | High | 0 |
| FR-07 | 사용 통계: 도구 사용 순위, 일별 활동량, 토큰 소비 차트 | Medium | 2 |
| FR-08 | 파이프라인 시각화: 에이전트 체인을 노드 그래프로 시각화 | Medium | 3 |
| FR-09 | 프로젝트 관리: 칸반 보드 + 에이전트 자동 할당 | Medium | 2 |
| FR-10 | 커맨드바: 화면 하단 고정, 어떤 탭에서든 즉시 작업 지시 가능 | High | 1 |
| FR-11 | 온보딩: 첫 접속 시 빈 오피스 → 프로젝트 연결 → 에이전트 배치 90초 플로우 | Medium | 1 |
| FR-12 | 모드 전환: 개발자 모드(상세 로그+diff) / 간편 모드(요약+자연어) 토글 | Low | 2 |

### 3.2 Non-Functional Requirements

| Category | Criteria | Phase |
|----------|----------|-------|
| Performance | 오피스 뷰 Canvas 60fps 유지 (20x14 타일맵 + 50 캐릭터) | 1 |
| Performance | WebSocket 메시지 지연 < 100ms | 0 |
| Security | API 키 서버 프록시 (브라우저에 키 미전송) | 0 |
| Security | 127.0.0.1 바인딩 + 일회성 토큰 인증 | 0 |
| Security | shell:true 제거, 경로 트래버설 방지 | 0 |
| Security | WebSocket 인증 + 레이트 리밋 (10req/s) + 메시지 크기 제한 (64KB) | 0 |
| Usability | Progressive Disclosure — 첫 화면은 오피스+핵심지표 3개만 | 1 |
| Reliability | 서버 재시작 후 세션 이력 유지 (SQLite) | 1 |

---

## 4. Success Criteria

### 4.1 Phase 0 Definition of Done
- [ ] `npm run dev`로 프론트+백엔드 동시 실행
- [ ] Claude Code CLI 1개 subprocess 스폰 → 결과 WebSocket 수신 확인
- [ ] 127.0.0.1 바인딩 + 토큰 인증 동작

### 4.2 Phase 1 Definition of Done (MVP)
- [ ] 에이전트 오피스 뷰에서 캐릭터가 부서별로 배치되어 표시
- [ ] 커맨드바에서 에이전트에게 작업 지시 → 실시간 로그 스트리밍 → 결과 확인 루프 완동
- [ ] 시스템 개요 카드에 .claude/ 파싱 데이터 표시
- [ ] 외부 1명 이상에게 데모 후 피드백 수집

### 4.3 Quality Criteria
- [ ] TypeScript strict mode
- [ ] ESLint + Prettier 설정
- [ ] 빌드 에러 0개
- [ ] Canvas 비활성 탭에서 rAF 정지 (성능 최적화)

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| **스코프 폭발** — 8개 모듈 동시 개발 시도 | High | High | Phase별 엄격 분리, Phase 1은 MVP 2~3개 페이지로 한정 |
| **Claude Code CLI 비공식 인터페이스 변경** | High | Medium | stream-json 파싱에 방어적 스키마 검증, CLI 버전 체크 |
| **Anthropic 공식 대시보드 출시** | High | Medium | 멀티벤더(에이전트 애그노스틱) 확장으로 차별화 (Phase 3+) |
| **1인 개발 번아웃** | High | Medium | 2주 스프린트 사이클, Phase 간 1주 버퍼, 각 Phase 독립 배포 가능 |
| **동시 subprocess 관리** | Medium | Medium | AgentProcessPool (p-limit 기반 concurrency 제한), 좀비 프로세스 정리 |
| **API 비용 통제** | Medium | Low | 토큰 사용량 대시보드 표시, 일일 한도 설정 기능 |
| **VS Code 보안경계 소멸** | High | High | P0 보안 대책 필수 적용 (127.0.0.1, 프록시, shell:true 제거) |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| 게임엔진 (GameEngine, TileMap, Character, Camera, Pathfinder) | Code | VS Code webview → 독립 웹 Canvas로 이식 |
| UI 컴포넌트 (AgentCard, SpeechBubble, OfficeView 등) | Code | VS Code CSS 변수 → 자체 다크 테마 변수로 매핑 |
| 통신 레이어 (useVscodeMessage) | Code | postMessage → WebSocket 교체 |
| 서비스 레이어 (MeetingService, ClaudeCodeProvider) | Code | VS Code API 의존 제거, Fastify 서버 모듈로 재작성 |
| 데이터 저장 (MeetingResultStore) | Code | 인메모리 → SQLite |

### 6.2 Reuse from claude_team_gui

| Source | Lines | Reuse Strategy |
|--------|-------|----------------|
| `webview/panel/game/*` (게임엔진) | ~2,400 | 파일 복사, 그대로 사용 |
| `webview/shared/*` (PixelAvatar, pixel-data) | ~400 | 파일 복사, 그대로 사용 |
| `webview/panel/*.tsx` (UI 컴포넌트) | ~1,600 | 파일 복사, CSS 변수만 교체 |
| `services/meeting-service.ts` | ~640 | 로직 참고, VS Code 의존 제거하여 재작성 |
| `providers/claude-code.ts` | ~240 | 로직 참고, Fastify 서버용으로 재작성 |

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Selected |
|-------|-----------------|:--------:|
| **Starter** | Simple structure | ☐ |
| **Dynamic** | Feature-based modules, BaaS integration | ☒ |
| **Enterprise** | Strict layer separation, DI, microservices | ☐ |

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Frontend Framework | Next.js / Vite+React | **Vite + React** | SSR 불필요 (로컬 앱), 기존 Vite 빌드 체계와 일관성, 빠른 HMR |
| State Management | Context / Zustand / Redux | **Zustand** | 번들 1.1KB, 기존 useState 14개+useRef 6개를 store 3개로 분리 |
| Backend | Express / Fastify / Hono | **Fastify** | WebSocket 네이티브 지원, 스키마 기반 검증, 높은 성능 |
| Realtime | WebSocket / SSE / Polling | **WebSocket** | 양방향 통신 필요 (작업 지시 + 결과 수신), 기존 postMessage 패턴과 유사 |
| DB | SQLite / PostgreSQL / JSON | **SQLite (better-sqlite3)** | 로컬 앱, 설치 불필요, 세션 이력 저장에 충분 |
| Chart | recharts / D3 / Chart.js | **recharts** | React 컴포넌트 기반, 레이더/도넛/라인 모두 지원 |
| Pipeline Viz | React Flow / dagre-d3 | **@xyflow/react** | 드래그 가능 인터랙티브 노드 그래프, 다크 테마 통합 용이 |
| Styling | Tailwind / CSS Modules | **CSS Variables + Modules** | 기존 component.css 체계 확장, 다크 테마 토큰 통일 |
| Testing | Vitest / Jest | **Vitest** | Vite 네이티브, 기존 프로젝트에서 이미 사용 |
| Process Mgmt | 직접 spawn / Agent SDK | **CLI subprocess + p-limit** | 기존 코드 재사용 최대화, 인증(OAuth/Max) 재활용 |

### 7.3 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (localhost:5173)                   │
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
│  │ /api/workspace│ 실시간 스트림 │ (p-limit, max concur=4) │ │
│  ├──────────────┼──────────────┼──────────────────────────┤ │
│  │ .claude/     │ SQLite       │ Claude CLI subprocess    │ │
│  │ Parser       │ (세션이력)    │ spawn('claude', args)    │ │
│  └──────────────┴──────────────┴──────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 7.4 Frontend Architecture

```
src/
├── app/                          # 웹 대시보드 진입점
│   ├── main.tsx                  # ReactDOM.createRoot
│   ├── App.tsx                   # 라우터 + DashboardShell
│   └── theme/
│       ├── dark.css              # 다크 테마 토큰 (QJC OS 스타일)
│       └── variables.css         # --dash-* 변수 체계
│
├── layouts/
│   └── DashboardShell.tsx        # CSS Grid (사이드바 | 메인)
│
├── pages/
│   ├── OfficePage.tsx            # 에이전트 오피스 (기존 엔진 재사용)
│   ├── OverviewPage.tsx          # 시스템 개요
│   ├── StatsPage.tsx             # 사용 통계 (Phase 2)
│   ├── PipelinePage.tsx          # 파이프라인 (Phase 3)
│   └── ProjectPage.tsx           # 프로젝트 관리 (Phase 2)
│
├── components/                   # 공유 UI 컴포넌트
│   ├── CommandBar.tsx            # 하단 고정 커맨드바
│   ├── AgentCard.tsx             # 기존 재사용
│   ├── SpeechBubble.tsx          # 기존 재사용
│   └── StatusBadge.tsx           # 상태 배지 (4색 코딩)
│
├── game/                         # 기존 게임엔진 그대로 이식
│   ├── GameEngine.ts
│   ├── TileMap.ts
│   ├── Character.ts
│   ├── Camera.ts
│   └── Pathfinder.ts
│
├── shared/                       # 기존 shared 코드
│   ├── pixel-data.ts
│   └── PixelAvatar.tsx
│
├── hooks/
│   ├── useWebSocket.ts           # postMessage 대체
│   └── useChunkBuffer.ts         # 기존 재사용
│
└── store/                        # zustand
    ├── useAgentStore.ts          # 에이전트 상태
    ├── useMeetingStore.ts        # 회의 상태 (기존 로직 추출)
    └── useDashboardStore.ts      # 시스템 통계
```

### 7.5 Backend API Design

```
REST API:
  GET  /api/workspace/agents      .claude/ 에이전트 목록
  GET  /api/workspace/skills      스킬 목록 및 내용
  GET  /api/workspace/hooks       훅 설정
  GET  /api/workspace/overview    시스템 개요 통계
  GET  /api/stats/usage           사용 통계
  GET  /api/stats/daily           일별 활동량
  POST /api/agent/run             에이전트 작업 실행
  POST /api/agent/stop            에이전트 작업 중지
  GET  /api/sessions              세션 이력

WebSocket Events:
  → agentStream     에이전트 실시간 출력
  → agentQueued     큐 대기 상태
  → agentDone       작업 완료
  → statusUpdate    에이전트 상태 변경
  ← runAgent        작업 지시 (클라이언트→서버)
  ← stopAgent       작업 중지 (클라이언트→서버)
```

---

## 8. Convention Prerequisites

### 8.1 Conventions to Define

| Category | Rule | Priority |
|----------|------|:--------:|
| **Naming** | 컴포넌트: PascalCase, 훅: useCamelCase, 유틸: camelCase | High |
| **Folder** | pages/ (라우트), components/ (공유), game/ (엔진), store/ (상태) | High |
| **Import** | React → 3rd party → @/ alias → relative | Medium |
| **CSS** | CSS Modules + 전역 변수 (--dash-*), 4색 상태 코딩 | High |
| **API** | REST: /api/{domain}/{action}, WS: camelCase 이벤트명 | High |
| **Error** | 서버: Fastify 에러 스키마, 클라이언트: ErrorBoundary + toast | Medium |

### 8.2 Environment Variables

| Variable | Purpose | Scope |
|----------|---------|-------|
| `PORT` | 백엔드 서버 포트 (기본 3001) | Server |
| `WS_PORT` | WebSocket 포트 (기본 PORT와 동일) | Server |
| `AUTH_TOKEN` | 일회성 인증 토큰 (서버 시작 시 자동 생성) | Server |
| `CLAUDE_CLI_PATH` | Claude Code CLI 경로 (기본: claude) | Server |
| `MAX_CONCURRENT` | 최대 동시 에이전트 수 (기본: 4) | Server |
| `WORKSPACE_ROOT` | 작업 디렉토리 경로 | Server |

---

## 9. Timeline & Milestones

| Phase | Duration | Period | Deliverable |
|-------|----------|--------|-------------|
| **Phase 0** | 2주 | W1-W2 | 빌드 동작하는 빈 셸 + CLI 통신 프로토타입 |
| **Phase 1** | 4주 | W3-W6 | MVP: 에이전트 오피스 + 작업 루프 + 시스템 개요 |
| *버퍼* | 1주 | W7 | 피드백 수집 + Phase 2 우선순위 조정 |
| **Phase 2** | 4주 | W8-W11 | 통계 + 프로젝트 보드 + 이중 뷰 |
| *버퍼* | 1주 | W12 | 중간 리뷰 |
| **Phase 3** | 4주 | W13-W16 | 파이프라인 + 카탈로그 + 자동화 |
| **Polish** | 2주 | W17-W18 | UI 폴리싱, 성능 최적화, 문서화, v1.0 릴리스 |

**총 예상: 18주 (~4.5개월)**

---

## 10. Business Model (장기 로드맵)

| Phase | Period | Strategy |
|-------|--------|----------|
| 커뮤니티 확보 | 0~6개월 | 오픈코어: 코어 대시보드 무료 오픈소스 |
| 프리미엄 | 6~12개월 | 고급 통계/팀 공유/비용 최적화 리포트 — $9~19/월 |
| 플랫폼 확장 | 12개월~ | 멀티 벤더 (Codex CLI, Gemini CLI) 에이전트 애그노스틱 대시보드 |

---

## 11. Next Steps

1. [ ] Design 문서 작성 (`/pdca design web-dashboard`)
2. [ ] Phase 0 프로젝트 보일러플레이트 생성
3. [ ] 기존 claude_team_gui에서 재사용 코드 복사
4. [ ] 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-03-30 | 10인 에이전트 회의 결과 기반 초안 작성 | user |
