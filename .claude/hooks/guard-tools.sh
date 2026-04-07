#!/bin/bash
# PreToolUse hook — 명시적 지시 없으면 도구 실행 차단

if [ "${ACTION_AUTHORIZED}" = "false" ]; then
  echo '{"decision":"deny","reason":"명시적 지시 없음. 행동 지시(해줘/실행해/고쳐줘 등)가 있을 때만 도구를 사용합니다."}'
fi
