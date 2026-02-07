/**
 * 클라이언트 소켓 연결 및 전사 배치 처리.
 *
 * ## Processing Lock + Pending Queue 전략
 * 5초마다 배치 타이머가 돌되, LLM이 처리 중이면 새 텍스트를 큐(pendingText)에
 * 누적한다. LLM 응답이 돌아온 뒤 큐에 텍스트가 있으면 **즉시** 다음 호출을 하므로
 * 5초를 안 기다리고 연속 처리된다.
 *
 * 15초 자동 넘김 포맷에서 한 슬라이드당 확실히 2회, 빠르면 3회 갱신 가능.
 */

const BATCH_INTERVAL_MS = 5 * 1000; // 5초

/**
 * @param {import("socket.io").Server} io
 * @param {{
 *   onBatch: (socket: import("socket.io").Socket, batchText: string) => void | Promise<void>,
 *   onDisconnect?: (socketId: string) => void
 * }} options
 */
export function attachSocketHandlers(io, { onBatch, onDisconnect }) {
  io.on("connection", (socket) => {
    const clientId = socket.id.slice(0, 8);
    console.log(`[${new Date().toISOString()}] [CONNECT] client=${clientId}`);

    /* ── 전사 버퍼 ── */
    const confirmedChunks = [];
    let lastInterim = "";

    /* ── Processing Lock ── */
    let processing = false;   // LLM 호출 중이면 true
    let pendingText = "";     // lock 중 누적된 텍스트
    /** 직전에 onBatch로 보낸 텍스트 — 동일하면 중복 호출 방지 */
    let lastProcessedBatch = "";

    socket.on("transcript", (payload) => {
      const { text, isFinal } = payload ?? {};
      const t = typeof text === "string" ? text.trim() : "";
      if (isFinal && t) {
        confirmedChunks.push(t);
        console.log(
          `[${new Date().toISOString()}] [TRANSCRIPT] isFinal=true text="${t}"`
        );
      } else if (!isFinal) {
        lastInterim = t;
      }
    });

    /**
     * 배치 텍스트를 수집한 뒤 onBatch를 호출하거나 큐에 넣는다.
     * @param {string} [forceText] - 큐에서 꺼낸 텍스트를 직접 넘길 때 사용
     */
    const dispatchBatch = async (forceText) => {
      /* ── 배치 텍스트 결정 ── */
      let batchText;
      if (forceText) {
        batchText = forceText;
      } else {
        const hasConfirmed = confirmedChunks.length > 0;
        batchText = hasConfirmed
          ? confirmedChunks.join(" ")
          : (lastInterim || "").trim();
        confirmedChunks.length = 0;
        lastInterim = "";
      }

      if (!batchText) return;

      /* ── Lock 중이면 큐에 누적 ── */
      if (processing) {
        pendingText = pendingText
          ? `${pendingText} ${batchText}`
          : batchText;
        console.log(
          `[${new Date().toISOString()}] [BATCH] client=${clientId} queued (LLM busy) pending="${pendingText}"`
        );
        return;
      }

      /* ── 중복 체크 ── */
      if (batchText === lastProcessedBatch) {
        console.log(
          `[${new Date().toISOString()}] [BATCH] client=${clientId} skip duplicate`
        );
        return;
      }

      /* ── LLM 호출 ── */
      processing = true;
      lastProcessedBatch = batchText;
      const source = forceText ? "pending-queue" : (confirmedChunks.length > 0 ? "final" : "last-interim");
      console.log(
        `[${new Date().toISOString()}] [BATCH] client=${clientId} source=${source} text="${batchText}"`
      );

      try {
        await onBatch(socket, batchText);
      } finally {
        processing = false;
      }

      /* ── 큐에 쌓인 텍스트가 있으면 즉시 연속 처리 ── */
      if (pendingText) {
        const queued = pendingText;
        pendingText = "";
        console.log(
          `[${new Date().toISOString()}] [BATCH] client=${clientId} flushing pending queue`
        );
        dispatchBatch(queued);
      }
    };

    const tick = () => dispatchBatch();

    const batchTimer = setInterval(tick, BATCH_INTERVAL_MS);

    socket.on("disconnect", (reason) => {
      clearInterval(batchTimer);
      onDisconnect?.(socket.id);
      console.log(
        `[${new Date().toISOString()}] [DISCONNECT] client=${clientId} reason=${reason}`
      );
    });
  });
}
