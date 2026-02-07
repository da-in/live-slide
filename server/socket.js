/**
 * 클라이언트 소켓 연결 및 전사 배치 처리.
 * io 인스턴스에 connection/transcript/disconnect 핸들러를 붙이고,
 * 10초 배치가 찼을 때 onBatch(socket, batchText) 콜백을 호출한다.
 */

const BATCH_INTERVAL_MS = 10 * 1000; // 10초

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

    const confirmedChunks = [];
    let lastInterim = "";

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

    const tick = () => {
      const hasConfirmed = confirmedChunks.length > 0;
      const batchText = hasConfirmed
        ? confirmedChunks.join(" ")
        : (lastInterim || "").trim();

      if (batchText) {
        const source = hasConfirmed ? "final" : "last-interim";
        console.log(
          `[${new Date().toISOString()}] [BATCH] client=${clientId} source=${source} text="${batchText}"`
        );
        onBatch(socket, batchText);
      }

      confirmedChunks.length = 0;
      lastInterim = "";
    };

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
