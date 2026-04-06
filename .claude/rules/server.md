---
paths:
  - "packages/server/**"
---

# Server Rules

- 라우트 추가 시 `packages/server/src/routes/`에 파일 생성
- CLI 프로세스는 반드시 `agent-pool.ts`의 p-limit 래퍼를 통해 실행. 직접 spawn 금지.
- DB 파일(`*.db`, `*.db-shm`, `*.db-wal`)을 git에 커밋 금지.
- Fastify 에러 응답: `reply.code(xxx).send({ error: ... })` 형식 통일
- DB 스키마 참조: `packages/server/src/db/`
- WS 이벤트 브로드캐스트 시 `@radar/shared`의 `ServerEvent` 타입 사용
