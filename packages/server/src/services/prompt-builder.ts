// Prompt Builder — constructs full prompts by combining identity + memory + context
import type { MeetingAgentId, AgentMemory } from '@radar/shared';
import { getAllFocusSummaries } from './agent-memory.js';

const AGENT_NAMES: Record<MeetingAgentId, string> = {
  pd: '민준 (Product Director)',
  developer: '서진 (Lead Developer)',
  planner: '하은 (Product Planner)',
  'ui-designer': '도윤 (UI/UX Designer)',
};

function memoryBlock(memory: AgentMemory): string {
  const parts: string[] = [];

  if (memory.identity) {
    parts.push('=== 당신의 정체성 ===\n' + memory.identity);
  }
  if (memory.journal) {
    parts.push('=== 당신의 기록 (최근) ===\n' + memory.journal);
  }
  if (memory.currentFocus) {
    parts.push('=== 현재 집중 사항 ===\n' + memory.currentFocus);
  }
  if (memory.recentMeetings.length > 0) {
    parts.push('=== 최근 회의 노트 ===\n' + memory.recentMeetings.join('\n---\n'));
  }

  return parts.join('\n\n');
}

/** PD Opening: review team status and propose agenda */
export function buildOpeningPrompt(
  pdMemory: AgentMemory,
  projectStatus: string,
): string {
  const focusSummaries = getAllFocusSummaries();
  const teamStatus = Object.entries(focusSummaries)
    .filter(([id]) => id !== 'pd')
    .map(([id, focus]) => `### ${AGENT_NAMES[id as MeetingAgentId]}\n${focus}`)
    .join('\n\n');

  return `${memoryBlock(pdMemory)}

=== 팀 현황 ===
${teamStatus}

=== 프로젝트 상태 ===
${projectStatus}

=== 지시 ===
당신은 PD 민준입니다. 위 맥락을 바탕으로 회의를 시작하세요:
1. 팀 현황을 간단히 리뷰하세요
2. 이번 회의의 핵심 안건을 제시하세요
3. 각 팀원에게 구체적인 질문이나 요청을 하세요

중요: 도구(Read, Bash 등)를 사용하지 마세요. 이미 제공된 맥락만으로 판단하세요.
응답은 반드시 텍스트로 작성하세요.

응답 마지막에 반드시 다음 JSON 블록을 포함하세요:
\`\`\`json
{"agenda": ["안건1", "안건2", "..."]}
\`\`\``;
}

/** Team member discussion: respond to PD agenda + prior messages */
export function buildDiscussionPrompt(
  agentMemory: AgentMemory,
  conversation: string,
): string {
  return `${memoryBlock(agentMemory)}

=== 회의 진행 상황 ===
${conversation}

=== 지시 ===
당신은 ${AGENT_NAMES[agentMemory.agentId]}입니다.
PD가 제시한 안건에 대해 당신의 전문 관점에서 의견을 주세요.
다른 팀원의 의견에 동의/반대/보완할 부분이 있으면 언급하세요.
구체적이고 실행 가능한 제안을 하세요.

중요: 도구(Read, Bash 등)를 사용하지 마세요. 이미 제공된 맥락만으로 의견을 말하세요.
응답은 반드시 텍스트로 작성하세요.`;
}

/** PD Decision: synthesize discussion and assign tasks */
export function buildDecisionPrompt(
  pdMemory: AgentMemory,
  fullConversation: string,
): string {
  return `${memoryBlock(pdMemory)}

=== 회의 전체 대화 ===
${fullConversation}

=== 지시 ===
토론을 종합하여 다음을 수행하세요:
1. 핵심 결정사항을 확정하세요
2. 각 팀원에게 구체적 태스크를 할당하세요 (본인 포함 가능)
3. 각 태스크의 완료 기준을 명시하세요

중요: 도구(Read, Bash 등)를 사용하지 마세요. 텍스트로만 응답하세요.

응답 마지막에 반드시 다음 JSON 블록을 포함하세요:
\`\`\`json
{"decisions": ["결정1", "결정2"], "tasks": [{"assignee": "developer", "task": "태스크 제목", "description": "상세 설명"}, {"assignee": "planner", "task": "...", "description": "..."}, {"assignee": "ui-designer", "task": "...", "description": "..."}]}
\`\`\``;
}

/** Execution: agent performing assigned task */
export function buildExecutionPrompt(
  agentMemory: AgentMemory,
  task: string,
  taskDescription: string,
): string {
  return `${memoryBlock(agentMemory)}

=== 할당된 태스크 ===
**태스크**: ${task}
**상세**: ${taskDescription}

=== 지시 ===
당신은 ${AGENT_NAMES[agentMemory.agentId]}입니다.
위 태스크를 수행하세요. 실제 코드를 작성하거나 문서를 작성하세요.

작업 완료 후, 다음 형식으로 요약을 작성하세요:
\`\`\`json
{"summary": "작업 요약", "filesChanged": ["파일1", "파일2"], "nextSteps": ["다음 단계"]}
\`\`\``;
}

/** Journal entry: agent writes what they learned */
export function buildJournalPrompt(
  agentId: MeetingAgentId,
  meetingSeq: number,
  decisions: string[],
  taskResult: string,
): string {
  const sections = [
    `### 결정사항\n${decisions.map((d) => `- ${d}`).join('\n')}`,
    `### 내가 한 일\n${taskResult}`,
  ];

  return `## Meeting #${meetingSeq}\n\n${sections.join('\n\n')}`;
}
