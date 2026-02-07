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

attachSocketHandlers(io, {
  async onBatch(socket, batchText) {
    const payload = await llm.processBatch(batchText, socket.id);
    if (payload) {
      socket.emit("slide-update", payload);
      const clientId = socket.id.slice(0, 8);
      console.log(
        `[${new Date().toISOString()}] [EMIT] slide-update → client=${clientId} type=${payload.type} components=${payload.components?.length ?? 0}`
      );
    }
  },
  onDisconnect(socketId) {
    llm.clearContext(socketId);
  },
});

httpServer.listen(PORT, () => {
  console.log(`Server http+ws listening on http://localhost:${PORT}`);
});
