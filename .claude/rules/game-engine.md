---
paths:
  - "packages/client/src/game/**"
---

# Game Engine Rules

- game/ 디렉토리에서 React import 금지. 순수 Canvas + TypeScript만 사용.
- 새 엔티티는 `Character` 클래스 패턴을 따를 것.
- 기존 모듈(isoTransform, TileMap, Camera, Pathfinder) 재사용 우선.
- 외부에서 게임엔진 접근은 반드시 `useGameEngine` 훅을 통해서만.
