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

io.on("connection", (socket) => {
  const clientId = socket.id.slice(0, 8);
  console.log(`[${new Date().toISOString()}] [CONNECT] client=${clientId}`);

  socket.on("transcript", (payload) => {
    const { text, isFinal } = payload ?? {};
    console.log(
      `[${new Date().toISOString()}] [TRANSCRIPT] isFinal=${isFinal} text="${text ?? ""}"`
    );
  });

  socket.on("disconnect", (reason) => {
    console.log(
      `[${new Date().toISOString()}] [DISCONNECT] client=${clientId} reason=${reason}`
    );
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server http+ws listening on http://localhost:${PORT}`);
});
