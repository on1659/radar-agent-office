---
paths:
  - "packages/client/**"
---

# Client Rules

- 컴포넌트는 `components/`, 페이지는 `pages/`에 배치
- Zustand store는 `packages/client/src/store/`에 생성
- 인라인 스타일 + CSS 변수(`theme/variables.css`) 사용. CSS 모듈/styled-components 금지.
- Canvas API 직접 호출 금지 — `useGameEngine` 훅을 통해서만 접근
- root `package.json`에 런타임 의존성 추가 금지 (클라이언트 의존성은 client package.json에)
