"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { connectSocket, disconnectSocket, emitTranscript, emitInitContext } from "@/lib/socket";
import { getSpeechRecognition } from "@/lib/speech";
import type { ActionPayload, SlideComponent } from "@/types/slide";
import { mapComponent } from "@/lib/component-mapper";
import cursorLogo from "@/assets/cursor-logo.png";
import cursorKorea from "@/assets/cursur-korea.png";

function isSlideComponent(c: unknown): c is SlideComponent {
  if (!c || typeof c !== "object" || !("type" in c)) return false;
  const t = (c as { type: string }).type;
  if (t === "TITLE" || t === "DESCRIPTION") {
    return "content" in c && typeof (c as { content?: unknown }).content === "string";
  }
  if (t === "IMAGE") {
    return "src" in c && typeof (c as { src?: unknown }).src === "string";
  }
  return false;
}

function normalizePayload(payload: unknown): ActionPayload | null {
  if (!payload || typeof payload !== "object" || !("type" in payload)) return null;
  const p = payload as Record<string, unknown>;
  const type = p.type as string;
  if (type !== "SLIDE_UPDATE" && type !== "SLIDE_CLEAR" && type !== "SLIDE_APPEND") return null;
  const components = Array.isArray(p.components)
    ? (p.components as unknown[]).filter(isSlideComponent)
    : undefined;
  return { type, components, timestamp: typeof p.timestamp === "number" ? p.timestamp : undefined };
}

function applyPayload(current: SlideComponent[], payload: ActionPayload): SlideComponent[] {
  switch (payload.type) {
    case "SLIDE_UPDATE":
      return payload.components ?? [];
    case "SLIDE_CLEAR":
      return [];
    case "SLIDE_APPEND":
      return [...current, ...(payload.components ?? [])];
    default:
      return current;
  }
}

const THEME_STORAGE_KEY = "live-slide-theme";
const TIMER_STORAGE_KEY = "live-slide-timer";

function formatMmSs(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function PresentationPage() {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(false);
  const [components, setComponents] = useState<SlideComponent[]>([]);
  const [subtitle, setSubtitle] = useState("");
  const [connected, setConnected] = useState(false);
  const [theme, setTheme] = useState<"auto" | "hackathon" | null>(null);
  const [timerConfig, setTimerConfig] = useState<{ totalSeconds: number; phases: number } | null>(null);
  const [timerState, setTimerState] = useState({ elapsed: 0, phaseIndex: 0, phaseSecondsLeft: 0 });

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(THEME_STORAGE_KEY);
      setTheme(stored === "hackathon" ? "hackathon" : "auto");
    } catch {
      setTheme("auto");
    }
  }, []);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(TIMER_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as { totalSeconds?: number; phases?: number };
      const totalSeconds = Number(parsed?.totalSeconds);
      const phases = Number(parsed?.phases);
      if (totalSeconds > 0 && phases > 0) {
        const phaseDuration = Math.floor(totalSeconds / phases);
        setTimerConfig({ totalSeconds, phases });
        setTimerState({ elapsed: 0, phaseIndex: 0, phaseSecondsLeft: phaseDuration });
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    if (!timerConfig) return;
    const phaseDuration = Math.floor(timerConfig.totalSeconds / timerConfig.phases);
    const id = setInterval(() => {
      setTimerState((prev) => {
        const nextElapsed = prev.elapsed + 1;
        let nextPhaseIndex = prev.phaseIndex;
        let nextPhaseLeft = prev.phaseSecondsLeft - 1;
        if (nextPhaseLeft < 0) {
          if (prev.phaseIndex + 1 < timerConfig.phases) {
            nextPhaseIndex = prev.phaseIndex + 1;
            nextPhaseLeft = phaseDuration;
          } else {
            nextPhaseLeft = 0;
          }
        }
        return { elapsed: nextElapsed, phaseIndex: nextPhaseIndex, phaseSecondsLeft: nextPhaseLeft };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [timerConfig]);

  useEffect(() => {
    const t = requestAnimationFrame(() => {
      requestAnimationFrame(() => setIsVisible(true));
    });
    return () => cancelAnimationFrame(t);
  }, []);

  useEffect(() => {
    const socket = connectSocket();
    setConnected(socket.connected);

    // 발표 제목·사전 정보를 서버로 전송하여 프롬프트 초기 맥락 설정
    const sendInitContext = () => {
      try {
        const raw = sessionStorage.getItem("live-slide-init-context");
        if (raw) {
          const { title, context } = JSON.parse(raw) as { title?: string; context?: string };
          if (title || context) {
            emitInitContext(title ?? "", context ?? "");
          }
        }
      } catch {
        // ignore
      }
    };

    socket.on("connect", () => {
      setConnected(true);
      sendInitContext();
    });
    // 이미 연결되어 있으면 즉시 전송
    if (socket.connected) {
      sendInitContext();
    }

    socket.on("disconnect", () => setConnected(false));

    const onSlideUpdate = (payload: unknown) => {
      const normalized = normalizePayload(payload);
      if (normalized) setComponents((prev) => applyPayload(prev, normalized));
    };

    socket.on("slide-update", onSlideUpdate);

    return () => {
      socket.off("slide-update", onSlideUpdate);
      socket.off("connect");
      socket.off("disconnect");
      disconnectSocket();
    };
  }, []);

  // 프레젠테이션 진입 시 연결한 같은 소켓으로 전사 전송 → 서버가 이 소켓에 slide-update 응답
  useEffect(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "ko-KR";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[event.resultIndex];
      const text = result[0].transcript.trim();
      const isFinal = result.isFinal;
      setSubtitle(text);
      emitTranscript(text, isFinal);
    };

    recognition.start();

    return () => {
      recognition.stop();
    };
  }, []);

  const isHackathonTheme = theme === "hackathon";

  return (
    <div
      className={`min-h-screen transition-opacity duration-[600ms] ease-out ${isHackathonTheme ? "bg-black" : "bg-gray-900"}`}
      style={{ opacity: isVisible ? 1 : 0 }}
    >
      {isHackathonTheme ? (
        <>
          <div className="pointer-events-none fixed top-8 right-8 z-10">
            <Image
              src={cursorLogo}
              alt=""
              width={280}
              height={93}
              className="h-20 w-auto object-contain"
            />
          </div>
          <div className="pointer-events-none fixed bottom-8 left-1/2 z-10 -translate-x-1/2">
            <Image
              src={cursorKorea}
              alt=""
              width={240}
              height={80}
              className="h-16 w-auto object-contain"
            />
          </div>
        </>
      ) : null}

      <main className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center gap-8 px-8 py-12">
        {components.length === 0 ? (
          <p className="text-center text-gray-500">슬라이드 내용이 없습니다.</p>
        ) : (
          components.map((comp, i) => mapComponent(comp, i))
        )}
      </main>

      {subtitle ? (
        <div className="fixed bottom-16 left-0 right-0 flex justify-center px-4 pb-2">
          <p className="max-w-3xl rounded-lg bg-black/70 px-4 py-3 text-center text-lg leading-relaxed text-white">
            {subtitle}
          </p>
        </div>
      ) : null}

      <div className="fixed bottom-4 left-4 flex items-center gap-2 text-xs text-gray-500">
        <span
          className={`inline-block h-2 w-2 shrink-0 rounded-full ${
            connected ? "bg-green-500" : "bg-red-500"
          }`}
          aria-hidden
        />
        <span>{connected ? "서버 연결됨 (localhost:8000)" : "서버 미연결"}</span>
      </div>

      <div className="fixed bottom-4 right-4 z-10 flex flex-col items-end gap-2">
        {timerConfig ? (
          <div className="rounded-lg bg-black/60 px-3 py-2 text-right text-xs text-white">
            <div>
              Phase {timerState.phaseIndex + 1}/{timerConfig.phases} · {formatMmSs(timerState.phaseSecondsLeft)}
            </div>
            <div>
              {formatMmSs(timerState.elapsed)} / {formatMmSs(timerConfig.totalSeconds)}
            </div>
          </div>
        ) : null}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            router.push("/");
          }}
          className="rounded px-2.5 py-1.5 text-xs text-gray-500 opacity-40 transition-opacity duration-200 hover:opacity-90 focus:opacity-90 focus:outline-none"
          aria-label="발표 종료"
        >
          발표 종료
        </a>
      </div>
    </div>
  );
}
