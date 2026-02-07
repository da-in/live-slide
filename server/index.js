import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { attachSocketHandlers } from "./socket.js";
import * as llm from "./llm.js";

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

/* ── 이미지 트리거 키워드 감지 ── */
const IMAGE_TRIGGER_RE = /이미지|사진|그림|보여\s?줘|보여\s?주세요/;

/**
 * 배치 텍스트에 이미지 트리거 키워드가 포함되어 있는지 확인한다.
 * @param {string} text
 * @returns {boolean}
 */
function detectImageTrigger(text) {
  return IMAGE_TRIGGER_RE.test(text);
}

attachSocketHandlers(io, {
  onInitContext(socketId, { title, context }) {
    llm.setContext(socketId, { initialContext: { title, context } });
  },
  async onBatch(socket, batchText) {
    const onBatchStart = Date.now();
    const needsImage = detectImageTrigger(batchText);

    if (needsImage) {
      console.log(
        `[${new Date().toISOString()}] [IMAGE-TRIGGER] 키워드 감지: "${batchText}"`
      );
    }

    const payload = await llm.processBatch(batchText, socket.id, { needsImage });
    const onBatchMs = Date.now() - onBatchStart;

    if (payload) {
      socket.emit("slide-update", payload);
      const clientId = socket.id.slice(0, 8);
      console.log(
        `[${new Date().toISOString()}] [EMIT] slide-update → client=${clientId} type=${payload.type} components=${payload.components?.length ?? 0} (onBatch 총 ${onBatchMs}ms)`
      );
    }
  },
  onDisconnect(socketId) {
    llm.clearContext(socketId);
  },
});

httpServer.listen(PORT, async () => {
  console.log(`Server http+ws listening on http://localhost:${PORT}`);
  await llm.warmup();
});
