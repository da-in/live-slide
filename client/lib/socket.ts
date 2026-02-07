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

/** 발표 시작 시 제목·사전 정보를 서버로 전송하여 프롬프트 초기 맥락으로 설정 */
export function emitInitContext(title: string, context: string): void {
  if (socket?.connected) {
    socket.emit("init-context", { title, context });
  }
}
