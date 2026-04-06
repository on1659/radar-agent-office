# Agent Meeting System Design Document

> **Summary**: 4인 에이전트 팀이 5시간 주기로 회의하고, 태스크를 수행하며, 메모리로 학습하는 영속적 멀티에이전트 시스템
>
> **Project**: radar-agent-office
> **Version**: 0.1.0
> **Date**: 2026-04-04
> **Status**: Draft
> **Ref**: Paperclip "Zero-human company" 컨셉 + 독자적 회의/메모리 시스템

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 1회성 에이전트 실행은 맥락이 끊김. 팀처럼 기억하고 성장하는 에이전트가 필요 |
| **WHO** | 프로젝트 오너 (사용자). 에이전트 팀에게 방향만 주고 자동으로 개발 진행 |
| **RISK** | 토큰 비용 폭증 (회의마다 4에이전트 호출), 메모리 무한 증가, 회의 품질 저하 |
| **SUCCESS** | 5시간 주기 회의 자동 실행, 에이전트가 이전 회의 내용 기억, 실제 코드 변경 발생 |
| **SCOPE** | Phase 1: 메모리+회의 엔진 → Phase 2: 스케줄러 → Phase 3: UI 통합 |

---

## 1. Agent Identity System

### 1.1 에이전트 구성

| ID | 이름 | 역할 | 모델 | 판단 기준 |
|----|------|------|------|-----------|
| `pd` | 민준 (Min-jun) | Product Director | opus | "명확한 목표와 방향이 있는가?" |
| `developer` | 서진 (Seo-jin) | Lead Developer | sonnet | "유지보수 가능한가?" |
| `planner` | 하은 (Ha-eun) | Product Planner | sonnet | "사용자 시나리오가 빈틈없는가?" |
| `ui-designer` | 도윤 (Do-yun) | UI/UX Designer | sonnet | "사용자가 3초 안에 이해하는가?" |

### 1.2 Identity 파일 구조

```
data/agents/{agent-id}/
├── identity.md          # 불변. 페르소나 정의
├── journal.md           # 누적. 결정/학습 기록 (append-only)
├── current-focus.md     # 가변. 현재 집중 사항
└── meetings/
    └── {date}-{seq}.md  # 회의별 개인 노트
```

- `identity.md`: 역할, 성격, 판단기준, 말투, 강점/약점. **수정 금지** (캐릭터 일관성)
- `journal.md`: 매 세션 후 에이전트가 직접 작성. 최근 20개 엔트리만 프롬프트에 주입
- `current-focus.md`: 현재 스프린트/태스크. 회의 후 PD가 업데이트

### 1.3 팀 다이나믹스

```
민준(PD) ←→ 서진(Dev): 협력. 둘 다 "제대로" 지향
민준(PD) ←→ 하은(기획): "왜 만드는지" 질문으로 기획 방향 잡아줌
민준(PD) ←→ 도윤(UI): "목표에 맞는 UI인가?" 기준 제시
하은(기획) ←→ 도윤(UI): 스펙 디테일 vs UX 단순화 긴장
서진(Dev) ←→ 도윤(UI): 구현 난이도 vs 디자인 이상 긴장
```

---

## 2. Memory System

### 2.1 메모리 계층

| 계층 | 파일 | 수명 | 프롬프트 주입 |
|------|------|------|--------------|
| Identity | `identity.md` | 영구 (불변) | 항상 전문 |
| Journal | `journal.md` | 영구 (append) | 최근 20개 엔트리 |
| Focus | `current-focus.md` | 회의마다 갱신 | 항상 전문 |
| Meeting Notes | `meetings/*.md` | 영구 | 최근 3개 회의 |

### 2.2 Journal Entry Format

```markdown
## [2026-04-04 14:00] Meeting #3 — 대시보드 Phase 1 진행상황

### 결정사항
- WebSocket 핸들러 리팩터링 우선순위 상향

### 내가 한 일
- cli-runner.ts에 system prompt injection 기능 추가

### 배운 것
- Claude CLI --system-prompt 플래그는 없음. 프롬프트 prefix로 대체해야 함

### 다음에 할 것
- meeting-engine.ts 구현
```

### 2.3 메모리 크기 관리

- Journal: 엔트리당 ~500자 제한. 20개 = ~10,000자 → 프롬프트의 ~15%
- Meeting Notes: 회의당 ~2,000자. 3개 = ~6,000자
- 총 메모리 주입량: identity(1K) + journal(10K) + focus(500) + meetings(6K) ≈ **~18K자**
- 한계 초과 시: 오래된 journal 엔트리는 `journal-archive.md`로 이동

---

## 3. Meeting Protocol

### 3.1 회의 흐름

```
Phase 1: Context Loading (자동)
  ├─ 각 에이전트의 current-focus.md 수집
  ├─ 최근 회의록 로드
  └─ 프로젝트 상태 스캔 (git diff, 파일 변경 등)

Phase 2: Opening — PD 민준 (1회 호출)
  ├─ 모든 에이전트의 현재 상태 리뷰
  ├─ 안건 제시 (목표 기반)
  └─ 각 에이전트에게 질문/요청

Phase 3: Discussion — 순차 호출 (3회)
  ├─ 하은(기획): 스펙 관점 의견
  ├─ 서진(개발): 기술 관점 의견
  └─ 도윤(UI): UX 관점 의견

Phase 4: Decision — PD 민준 (1회 호출)
  ├─ 토론 내용 종합
  ├─ 결정사항 확정
  ├─ 태스크 분배 (JSON 구조)
  └─ 회의록 작성

Phase 5: Execution (병렬)
  ├─ 각 에이전트가 할당된 태스크 실행
  ├─ cli-runner.ts를 통한 실제 코드 작업
  └─ 실행 결과를 journal.md에 기록

Phase 6: Memory Update (자동)
  ├─ journal.md append
  ├─ current-focus.md 갱신
  └─ meetings/ 에 회의록 저장
```

### 3.2 회의 프롬프트 구조

PD (Opening) 프롬프트:
```
[identity.md 전문]
[journal.md 최근 20개]
[current-focus.md]

--- 팀 현황 ---
[developer의 current-focus.md]
[planner의 current-focus.md]
[ui-designer의 current-focus.md]

--- 프로젝트 상태 ---
[git status / recent changes 요약]

--- 지시 ---
당신은 PD 민준입니다. 위 맥락을 바탕으로:
1. 팀 현황을 리뷰하세요
2. 이번 회의의 안건을 제시하세요
3. 각 팀원에게 구체적인 질문이나 요청을 하세요

반드시 JSON 블록으로 안건 목록을 출력하세요:
{"agenda": ["안건1", "안건2", ...]}
```

팀원 (Discussion) 프롬프트:
```
[identity.md 전문]
[journal.md 최근 20개]
[current-focus.md]

--- 회의 진행 ---
[PD의 안건 + 이전 발언자들의 의견]

--- 지시 ---
당신은 {name}입니다. PD가 제시한 안건에 대해 당신의 관점에서 의견을 주세요.
다른 팀원의 의견에 동의/반대/보완할 부분이 있으면 언급하세요.
```

PD (Decision) 프롬프트:
```
[PD의 identity + memory]

--- 회의 전체 대화 ---
[Opening + 3명의 의견]

--- 지시 ---
토론을 종합하여:
1. 결정사항을 확정하세요
2. 각 팀원에게 구체적 태스크를 할당하세요

반드시 JSON 블록으로 태스크를 출력하세요:
{"tasks": [
  {"assignee": "developer", "task": "...", "description": "..."},
  {"assignee": "planner", "task": "...", "description": "..."},
  {"assignee": "ui-designer", "task": "...", "description": "..."}
]}
```

### 3.3 회의 비용 추정

| 단계 | 호출 수 | 모델 | 예상 토큰 | 예상 비용 |
|------|---------|------|-----------|-----------|
| PD Opening | 1 | opus | ~5K in + ~2K out | ~$0.22 |
| Discussion (3명) | 3 | sonnet | ~4K in + ~1K out ×3 | ~$0.08 |
| PD Decision | 1 | opus | ~8K in + ~2K out | ~$0.27 |
| Execution (4명) | 4 | sonnet | ~10K in + ~5K out ×4 | ~$0.36 |
| **Total per meeting** | **9** | | | **~$0.93** |
| **Daily (4.8 meetings)** | | | | **~$4.47** |

---

## 4. Scheduler

### 4.1 주기

- **기본**: 5시간 (하루 ~4.8회 회의)
- **설정 가능**: `MEETING_INTERVAL_HOURS` 환경변수
- **구현**: `node-cron` (서버 프로세스 내 동작)

### 4.2 트리거 조건

| 조건 | 동작 |
|------|------|
| 스케줄 도달 (5h) | 자동 회의 시작 |
| 사용자 수동 트리거 | REST API `POST /api/meetings/start` |
| 이전 회의 진행 중 | 스킵 (중복 방지) |
| 서버 재시작 | 마지막 회의 시간 기준으로 다음 회의 계산 |

### 4.3 환경변수 추가

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `MEETING_INTERVAL_HOURS` | 5 | 회의 주기 (시간) |
| `MEETING_AUTO_START` | true | 서버 시작 시 스케줄러 자동 활성화 |
| `AGENT_MEMORY_DIR` | data/agents | 에이전트 메모리 루트 |
| `MEETING_MAX_JOURNAL_ENTRIES` | 20 | 프롬프트에 주입할 최대 journal 수 |

---

## 5. Implementation Plan

### 5.1 신규 파일

| 파일 | 패키지 | 역할 |
|------|--------|------|
| `shared/src/meeting.ts` | shared | Meeting, MeetingPhase, AgentTask 타입 |
| `server/src/services/agent-memory.ts` | server | 에이전트 메모리 CRUD |
| `server/src/services/prompt-builder.ts` | server | identity + memory → prompt 조합 |
| `server/src/services/meeting-engine.ts` | server | 회의 오케스트레이션 (5 phase) |
| `server/src/services/scheduler.ts` | server | node-cron 스케줄러 |
| `server/src/routes/meetings.ts` | server | REST API (회의 시작/조회/이력) |
| `data/agents/*/identity.md` | - | 에이전트 페르소나 (4개) |
| `data/agents/*/current-focus.md` | - | 초기 포커스 |
| `data/agents/*/journal.md` | - | 빈 파일 (초기) |

### 5.2 수정 파일

| 파일 | 변경 내용 |
|------|-----------|
| `shared/src/index.ts` | meeting.ts re-export 추가 |
| `shared/src/events.ts` | meetingUpdate ServerEvent 추가 |
| `server/src/index.ts` | scheduler 초기화, meetings route 등록 |
| `server/src/config.ts` | 회의 관련 환경변수 추가 |
| `server/src/db/schema.ts` | meetings 테이블 추가 |

### 5.3 DB 스키마 추가

```sql
CREATE TABLE IF NOT EXISTS meetings (
  id TEXT PRIMARY KEY,
  sequence INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress',
  agenda TEXT,
  decisions TEXT,
  tasks TEXT,
  participants TEXT NOT NULL DEFAULT '["pd","developer","planner","ui-designer"]',
  total_tokens INTEGER DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  started_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE TABLE IF NOT EXISTS meeting_messages (
  id TEXT PRIMARY KEY,
  meeting_id TEXT NOT NULL REFERENCES meetings(id),
  agent_id TEXT NOT NULL,
  phase TEXT NOT NULL,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  tokens_used INTEGER DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

---

## 6. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/meetings/start` | 수동 회의 시작 |
| `GET` | `/api/meetings` | 회의 이력 조회 |
| `GET` | `/api/meetings/:id` | 회의 상세 (대화 포함) |
| `GET` | `/api/meetings/latest` | 최근 회의 |
| `GET` | `/api/agents/:id/memory` | 에이전트 메모리 조회 |
| `PUT` | `/api/agents/:id/memory/focus` | 에이전트 포커스 수정 |
| `GET` | `/api/scheduler/status` | 스케줄러 상태 |
| `POST` | `/api/scheduler/toggle` | 스케줄러 활성화/비활성화 |

---

## 7. WebSocket Events 추가

```typescript
// ServerEvent 추가
| { type: 'meetingUpdate'; meeting: MeetingStatus }
| { type: 'meetingMessage'; meetingId: string; agentId: string; phase: string; content: string }

// ClientEvent 추가
| { type: 'startMeeting'; agenda?: string }
| { type: 'stopMeeting'; meetingId: string }
```
