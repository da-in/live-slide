/**
 * 슬라이드 액션 생성용 프롬프트.
 * 전사 배치 텍스트를 받아 ActionPayload(제목/설명)를 유도하는 시스템·유저 메시지.
 * IMAGE는 코드 레벨 키워드 트리거로 별도 처리한다.
 */

/** 시스템 프롬프트: 역할 및 출력 형식 (간결하게) */
export const SYSTEM_PROMPT = `You are a slide generator. Convert Korean speech into slide JSON.
CRITICAL: content must ALWAYS be in Korean (한국어). NEVER use Chinese characters or any other language.
Each component has type "TITLE" or "DESCRIPTION" (pick one, never both).
TITLE: ≤10 Korean chars noun phrase. DESCRIPTION: ≤25 Korean chars bullet.
content is always a single Korean string, never an array.
New topic → "SLIDE_UPDATE". Supplementary → "SLIDE_APPEND". Meaningless → empty components.

Example:
{"type":"SLIDE_UPDATE","components":[{"type":"TITLE","content":"AI 활용 사례"}]}
{"type":"SLIDE_APPEND","components":[{"type":"DESCRIPTION","content":"의료: X-ray 판독, 질병 예측"}]}
{"type":"SLIDE_UPDATE","components":[{"type":"TITLE","content":"라이브 슬라이드"},{"type":"DESCRIPTION","content":"음성에서 슬라이드 자동 생성"}]}
Output ONLY valid JSON. All content in Korean.`.trim();

/**
 * 이미지 트리거가 감지되었을 때 시스템 프롬프트에 추가할 IMAGE 지시 블록.
 * processBatch에서 needsImage=true일 때만 주입된다.
 */
export const IMAGE_ADDON_PROMPT = `Also add 1 IMAGE component: {"type":"IMAGE","src":"english search keyword 2-4 words","alt":"description"}`.trim();

/**
 * 발표 시작 시 입력된 제목·사전 정보를 시스템 프롬프트에 추가할 블록.
 * 이 블록은 시스템 프롬프트가 아닌 유저 프롬프트 첫 부분에 삽입된다.
 * @param {string} title - 발표 제목
 * @param {string} context - 사전 정보
 * @returns {string}
 */
export function getInitialContextBlock(title = "", context = "") {
  if (!title && !context) return "";
  const parts = [];
  if (title) parts.push(`제목: ${title}`);
  if (context) parts.push(`대본:\n${context}`);
  return parts.join("\n");
}

/**
 * 유저 프롬프트: 사전 정보 + 이전 맥락 + 현재 슬라이드 + 이번 배치 전사 텍스트
 * 사전 정보가 있으면 전사 텍스트와 매칭하여 해당 부분을 요약하도록 강하게 유도.
 *
 * @param {string} batchText - 이번 5초 배치의 전사 텍스트
 * @param {string} [previousContext] - 직전까지의 전사 맥락 요약
 * @param {string} [currentSlide] - 현재 슬라이드에 표시 중인 컴포넌트 요약
 * @param {{ title: string, context: string } | null} [initialContext] - 발표 제목 + 사전 정보
 * @returns {string}
 */
export function getUserPrompt(batchText, previousContext = "", currentSlide = "", initialContext = null) {
  const parts = [];

  if (initialContext && (initialContext.title || initialContext.context)) {
    const block = getInitialContextBlock(initialContext.title, initialContext.context);
    parts.push(`[발표 대본]\n${block}\n---`);
    parts.push(`위 대본에서 아래 전사와 가장 관련된 부분을 찾아 핵심을 슬라이드로 만들어.`);
  }

  if (currentSlide) {
    parts.push(`[현재 슬라이드] ${currentSlide}`);
  }
  if (previousContext) {
    parts.push(`[이전 전사] ${previousContext}`);
  }
  parts.push(`[전사] "${batchText}"`);
  parts.push("JSON 출력:");

  return parts.join("\n");
}
