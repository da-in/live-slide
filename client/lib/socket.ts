import { io, Socket } from "socket.io-client";

const SOCKET_URL =
  typeof window !== "undefined"
    ? `${window.location.protocol === "https:" ? "wss" : "ws"}://localhost:8000`
    : "";

let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function connectSocket(): Socket {
  if (socket?.connected) return socket;
  socket = io("http://localhost:8000", { transports: ["websocket", "polling"] });
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function emitTranscript(text: string, isFinal: boolean): void {
  if (socket?.connected) {
    socket.emit("transcript", { text, isFinal });
  }
}
