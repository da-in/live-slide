/**
 * 슬라이드 액션 생성용 프롬프트.
 * 전사 배치 텍스트를 받아 ActionPayload(제목/설명)를 유도하는 시스템·유저 메시지.
 * IMAGE는 코드 레벨 키워드 트리거로 별도 처리한다.
 */

/** 시스템 프롬프트: 역할 및 출력 형식 */
export const SYSTEM_PROMPT = `당신은 발표 슬라이드 생성 어시스턴트입니다.
음성 전사 텍스트를 받아 슬라이드용 짧은 문구로 바꿔야 합니다.

규칙:
1. 전사 텍스트를 그대로 쓰지 말 것. 반드시 핵심 키워드만 추출하여 짧게 변환.
2. TITLE은 10자 이내 명사구. DESCRIPTION은 20자 이내 개조식.
3. 주제가 바뀌면 SLIDE_UPDATE, 보충이면 SLIDE_APPEND.
4. 의미 없는 발화("음...", "그래서...")는 빈 components.

예시:
입력: "오늘 제가 말씀드릴 내용은 인공지능의 활용 사례에 대해서 말씀드리려고 합니다"
출력: {"type":"SLIDE_UPDATE","components":[{"type":"TITLE","content":"AI 활용 사례"}]}

입력: "의료 분야에서 AI가 활용되고 있는데요 엑스레이 판독이나 질병 예측에서 많이 쓰입니다"
출력: {"type":"SLIDE_APPEND","components":[{"type":"DESCRIPTION","content":"의료: X-ray 판독, 질병 예측"}]}

입력: "음 그래서 아까 말씀드린 것처럼..."
출력: {"type":"SLIDE_UPDATE","components":[]}

출력 형식 (JSON만 출력):
{"type":"SLIDE_UPDATE|SLIDE_APPEND","components":[{"type":"TITLE|DESCRIPTION","content":"..."}]}`.trim();

/**
 * 이미지 트리거가 감지되었을 때 시스템 프롬프트에 추가할 IMAGE 지시 블록.
 * processBatch에서 needsImage=true일 때만 주입된다.
 */
export const IMAGE_ADDON_PROMPT = `
추가 지시: 이번 발화에 이미지 요청이 포함되어 있습니다.
components에 IMAGE를 1개 추가하세요.
IMAGE 형식: {"type":"IMAGE","src":"영문 검색 키워드 2~4단어","alt":"설명"}
예: {"type":"IMAGE","src":"electric vehicle charging","alt":"전기차 충전소"}`.trim();

/**
 * 발표 시작 시 입력된 제목·사전 정보를 시스템 프롬프트에 추가할 블록.
 * @param {string} title - 발표 제목
 * @param {string} context - 사전 정보
 * @returns {string}
 */
export function getInitialContextBlock(title = "", context = "") {
  const parts = [];
  if (title) parts.push(`발표 제목: ${title}`);
  if (context) parts.push(`사전 정보:\n${context}`);
  if (parts.length === 0) return "";
  return `[발표 배경]\n${parts.join("\n")}

위 배경 정보를 항상 참고하여 발표 흐름에 맞는 슬라이드를 생성하세요.`;
}

/**
 * 유저 프롬프트: 이전 맥락 + 현재 슬라이드 + 이번 배치 전사 텍스트
 * @param {string} batchText - 이번 5초 배치의 전사 텍스트
 * @param {string} [previousContext] - 직전까지의 전사 맥락 요약
 * @param {string} [currentSlide] - 현재 슬라이드에 표시 중인 컴포넌트 요약
 * @returns {string}
 */
export function getUserPrompt(batchText, previousContext = "", currentSlide = "") {
  const parts = [];

  if (previousContext) {
    parts.push(`[맥락] ${previousContext}`);
  }
  if (currentSlide) {
    parts.push(`[현재 슬라이드] ${currentSlide}`);
  }
  parts.push(`[전사] "${batchText}"`);
  parts.push("핵심만 추출하여 JSON 출력.");

  return parts.join("\n");
}
