"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { connectSocket, disconnectSocket, emitTranscript } from "@/lib/socket";
import {
  getSpeechRecognition,
  getSpeechApiName,
  isSpeechSupported,
} from "@/lib/speech";

export default function SttSocketPanel() {
  const [listening, setListening] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastTranscript, setLastTranscript] = useState("");
  const [logs, setLogs] = useState<string[]>([]);
  const recognitionRef = useRef<{ stop: () => void } | null>(null);

  const addLog = useCallback((msg: string) => {
    setLogs((prev) =>
      [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 20)
    );
  }, []);

  useEffect(() => {
    const socket = connectSocket();
    setConnected(socket.connected);

    socket.on("connect", () => {
      setConnected(true);
      addLog("소켓 연결됨");
    });
    socket.on("disconnect", () => {
      setConnected(false);
      addLog("소켓 끊김");
    });

    return () => {
      disconnectSocket();
    };
  }, [addLog]);

  const toggleListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      addLog("이 브라우저는 음성 인식을 지원하지 않습니다.");
      return;
    }

    if (listening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setListening(false);
      addLog("음성 인식 중지");
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ko-KR";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex];
      const text = result[0].transcript;
      const isFinal = result.isFinal;
      setLastTranscript(text);
      emitTranscript(text, isFinal);
      if (isFinal) addLog(`전송(최종): "${text}"`);
      else addLog(`전송(임시): "${text}"`);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      const msg = event.message ? ` (${event.message})` : "";
      addLog(`STT 오류: ${event.error}${msg}`);
      if (event.error === "network") {
        addLog(
          "→ Web Speech API는 음성을 Google 등 외부 서버로 보냅니다. 인터넷 연결, 방화벽/프록시(회사망), VPN을 확인하세요."
        );
        addLog("→ HTTPS 또는 localhost에서만 마이크가 동작합니다. 60초 후 자동 종료될 수 있습니다.");
      }
    };

    recognition.onend = () => {
      recognitionRef.current = null;
      setListening(false);
    };

    recognition.start();
    setListening(true);
    addLog("음성 인식 시작 (말해보세요)");
  }, [listening, addLog]);

  const supported = isSpeechSupported();
  const apiName = getSpeechApiName();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Live Slide — STT + Socket</h1>

        <div className="flex items-center gap-4">
          <span
            className={`inline-block w-3 h-3 rounded-full ${
              connected ? "bg-green-500" : "bg-red-500"
            }`}
          />
          <span>
            {connected ? "서버 연결됨 (localhost:8000)" : "서버 미연결"}
          </span>
        </div>

        {/* Web Speech API 사용 여부 명시 */}
        {supported && (
          <p className="text-sm text-gray-400">
            STT: <strong className="text-gray-300">Web Speech API</strong> 사용
            중
            {apiName && (
              <span className="ml-1 font-mono text-gray-500">({apiName})</span>
            )}
          </p>
        )}
        {!supported && (
          <p className="text-amber-400">
            Chrome 등 Web Speech API 지원 브라우저에서 사용해 주세요.
          </p>
        )}

        <button
          type="button"
          onClick={toggleListening}
          disabled={!connected || !supported}
          className={`px-6 py-3 rounded-lg font-medium transition ${
            listening
              ? "bg-red-600 hover:bg-red-700"
              : "bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed"
          }`}
        >
          {listening ? "마이크 끄기" : "마이크 켜기 (STT → 서버 전송)"}
        </button>

        {lastTranscript && (
          <div className="p-4 bg-gray-800 rounded-lg">
            <p className="text-sm text-gray-400">최근 전송 텍스트</p>
            <p className="text-lg mt-1">{lastTranscript}</p>
          </div>
        )}

        <div className="p-4 bg-gray-800 rounded-lg">
          <p className="text-sm text-gray-400 mb-2">클라이언트 로그</p>
          <ul className="text-sm font-mono space-y-1 max-h-48 overflow-y-auto">
            {logs.length === 0 && <li className="text-gray-500">—</li>}
            {logs.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
