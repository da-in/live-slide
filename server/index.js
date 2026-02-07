import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const PORT = 8000;

const io = new Server(httpServer, {
  cors: { origin: ["http://localhost:3000", "http://127.0.0.1:3000"] },
  transports: ["websocket", "polling"],
});

app.get("/health", (_, res) => {
  res.json({ ok: true, message: "Live Slide server" });
});

const BATCH_INTERVAL_MS = 10 * 1000; // 10초

io.on("connection", (socket) => {
  const clientId = socket.id.slice(0, 8);
  console.log(`[${new Date().toISOString()}] [CONNECT] client=${clientId}`);

  /** 이번 배치(10초) 동안 쌓은 최종 문장들 */
  const confirmedChunks = [];
  /** 아직 최종이 안 나온 구간의 마지막 임시 결과 */
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
      // 임시는 로그 생략 또는 가끔만 로그
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
      // TODO: 여기서 batchText로 LLM 호출 후 slide-update 전송
    }

    confirmedChunks.length = 0;
    lastInterim = "";
  };

  const batchTimer = setInterval(tick, BATCH_INTERVAL_MS);

  socket.on("disconnect", (reason) => {
    clearInterval(batchTimer);
    console.log(
      `[${new Date().toISOString()}] [DISCONNECT] client=${clientId} reason=${reason}`
    );
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server http+ws listening on http://localhost:${PORT}`);
});
