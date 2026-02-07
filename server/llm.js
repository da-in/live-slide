/**
 * LLM 호출 (Ollama translategemma:12b).
 * 전사 배치 텍스트를 받아 의도 분석 후 ActionPayload를 반환한다.
 */

import { SYSTEM_PROMPT, getUserPrompt } from "./prompts/index.js";

const OLLAMA_URL = "http://localhost:11434/api/chat";
const MODEL = "translategemma:12b";
// const MODEL = "gpt-oss:20b-cloud";

/** 소켓(세션)별 이전 맥락을 저장하는 Map */
const contextMap = new Map();

/**
 * 이전 맥락 조회
 * @param {string} socketId
 * @returns {string}
 */
export function getContext(socketId) {
  return contextMap.get(socketId) ?? "";
}

/**
 * 이전 맥락 갱신
 * @param {string} socketId
 * @param {string} summary
 */
export function setContext(socketId, summary) {
  contextMap.set(socketId, summary);
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
 * @param {string} batchText - 이번 10초 배치의 전사 텍스트
 * @param {string} socketId - 소켓 ID (맥락 관리용)
 * @returns {Promise<object|null>} ActionPayload 또는 null
 */
export async function processBatch(batchText, socketId) {
  const previousContext = getContext(socketId);

  const body = {
    model: MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: getUserPrompt(batchText, previousContext) },
    ],
    stream: false,
    format: "json",
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

    // 맥락 갱신: 이번 배치 텍스트를 이전 맥락에 누적 (최근 3건만 유지)
    const updated = previousContext
      ? `${previousContext}\n${batchText}`
      : batchText;
    const lines = updated.split("\n").slice(-3).join("\n");
    setContext(socketId, lines);

    console.log(
      `[${new Date().toISOString()}] [LLM] model=${MODEL} type=${
        payload.type
      } components=${payload.components?.length ?? 0}`
    );

    return payload;
  } catch (err) {
    console.error(`[LLM] 처리 실패:`, err.message ?? err);
    return null;
  }
}
