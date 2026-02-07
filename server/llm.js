/**
 * LLM 호출 (Ollama translategemma:12b).
 * 전사 배치 텍스트를 받아 의도 분석 후 ActionPayload를 반환한다.
 */

import { SYSTEM_PROMPT, getUserPrompt } from "./prompts/index.js";

const OLLAMA_URL = "http://localhost:11434/api/chat";
/** 12b는 품질 우선, 4b는 속도 우선 (지연 약 1/2~1/3 수준 기대) */
// const MODEL = "translategemma:12b";
// const MODEL = "translategemma:4b";
const MODEL = "granite4:3b";

/** 생성 토큰 상한(JSON만 나오면 되므로 작게), 컨텍스트 창(입력 길이 제한으로 처리 속도 유리) */
const OLLAMA_OPTIONS = { num_predict: 256, num_ctx: 2048 };

/**
 * 소켓(세션)별 이전 맥락을 저장하는 Map.
 * 값 형태: { transcript: string, slide: string }
 *  - transcript: 최근 전사 텍스트 (최근 3건)
 *  - slide: 직전 LLM이 생성한 슬라이드 컴포넌트 요약
 */
const contextMap = new Map();

const EMPTY_CTX = { transcript: "", slide: "" };

/**
 * 이전 맥락 조회
 * @param {string} socketId
 * @returns {{ transcript: string, slide: string }}
 */
export function getContext(socketId) {
  return contextMap.get(socketId) ?? { ...EMPTY_CTX };
}

/**
 * 이전 맥락 갱신
 * @param {string} socketId
 * @param {{ transcript?: string, slide?: string }} partial
 */
export function setContext(socketId, partial) {
  const prev = getContext(socketId);
  contextMap.set(socketId, { ...prev, ...partial });
}

/**
 * 세션 정리 (disconnect 시 호출)
 * @param {string} socketId
 */
export function clearContext(socketId) {
  contextMap.delete(socketId);
}

/**
 * Ollama chat API 호출
 * @param {string} batchText - 이번 5초 배치의 전사 텍스트
 * @param {string} socketId - 소켓 ID (맥락 관리용)
 * @returns {Promise<object|null>} ActionPayload 또는 null
 */
export async function processBatch(batchText, socketId) {
  const ctx = getContext(socketId);
  const startMs = Date.now();

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: getUserPrompt(batchText, ctx.transcript, ctx.slide) },
    ],
    stream: false,
    format: "json",
    options: OLLAMA_OPTIONS,
  };

  try {
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      console.error(`[LLM] Ollama error: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const raw = data?.message?.content ?? "";

    const payload = JSON.parse(raw);

    // ── 맥락 갱신 ──
    // 전사: 최근 3건 유지
    const updatedTranscript = ctx.transcript
      ? `${ctx.transcript}\n${batchText}`
      : batchText;
    const transcriptLines = updatedTranscript.split("\n").slice(-3).join("\n");

    // 슬라이드: LLM이 생성한 컴포넌트 요약 (다음 호출에서 "현재 슬라이드 상태" 참조용)
    const slideSummary = (payload.components ?? [])
      .map((c) => `${c.type}: ${c.content ?? c.src ?? ""}`)
      .join(" | ");

    setContext(socketId, {
      transcript: transcriptLines,
      slide: slideSummary || ctx.slide, // 빈 응답이면 이전 슬라이드 유지
    });

    const elapsed = Date.now() - startMs;
    console.log(
      `[${new Date().toISOString()}] [LLM] model=${MODEL} type=${
        payload.type
      } components=${payload.components?.length ?? 0} ${elapsed}ms`
    );

    return payload;
  } catch (err) {
    console.error(`[LLM] 처리 실패:`, err.message ?? err);
    return null;
  }
}

/**
 * 서버 기동 시 한 번 호출하면 모델이 메모리에 로드되어 첫 요청 지연을 줄인다.
 */
export async function warmup() {
  try {
    const res = await fetch(OLLAMA_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: "user", content: "hi" }],
        stream: false,
        options: OLLAMA_OPTIONS,
      }),
    });
    if (res.ok) {
      console.log(`[LLM] warmup 완료: ${MODEL}`);
    } else {
      console.warn(`[LLM] warmup 실패: ${res.status} (Ollama 미기동 시 정상)`);
    }
  } catch (err) {
    console.warn("[LLM] warmup 실패:", err.message ?? err);
  }
}
