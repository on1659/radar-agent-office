#!/bin/bash
# UserPromptSubmit hook — 사용자 메시지에 명시적 행동 지시가 있는지 판단

INPUT=$(cat)
MESSAGE=$(echo "$INPUT" | python3 -c "import json,sys; print(json.load(sys.stdin).get('prompt',''))" 2>/dev/null || echo "")

# 명시적 행동 지시 키워드
if echo "$MESSAGE" | grep -qE '해줘|실행해|고쳐줘|만들어|켜줘|꺼줘|수정해|추가해|삭제해|올려줘|배포해|설정해|변경해|써줘|작성해|생성해|등록해|적용해|빌드해|설치해|제거해|업데이트해'; then
  echo "ACTION_AUTHORIZED=true" >> "$CLAUDE_ENV_FILE"
else
  echo "ACTION_AUTHORIZED=false" >> "$CLAUDE_ENV_FILE"
fi
