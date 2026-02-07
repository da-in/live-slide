"use client";

import { useState, useId, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import type { Presentation, BackgroundTheme } from "@/types/presentation";
import { getStoredPresentations, setStoredPresentations } from "@/lib/presentation-storage";
import cursorLogo from "@/assets/cursor-logo.png";

const BACKGROUND_OPTIONS: { value: BackgroundTheme; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "hackathon", label: "Cursor Hackathon" },
];

/** 좌측: 발표 목록 + 발표 생성하기 */
function PresentationList({
  presentations,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
}: {
  presentations: Presentation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCreate: () => void;
  onDelete: (id: string) => void;
}) {
  return (
    <aside className="flex w-72 shrink-0 flex-col border-r border-gray-200 bg-gray-50">
      <div className="border-b border-gray-200 p-4">
        <button
          type="button"
          onClick={onCreate}
          className="w-full rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          발표 생성하기
        </button>
      </div>
      <nav className="flex-1 overflow-y-auto p-2">
        {presentations.length === 0 ? (
          <p className="px-2 py-4 text-sm text-gray-500">
            생성한 발표가 없습니다.
            <br />
            위에서 발표를 생성해 보세요.
          </p>
        ) : (
          <ul className="space-y-1">
            {presentations.map((p) => {
              const isSelected = selectedId === p.id;
              return (
                <li
                  key={p.id}
                  className={`flex items-center gap-1 rounded-lg transition ${
                    isSelected ? "bg-gray-200" : "hover:bg-gray-100"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onSelect(p.id)}
                    className={`min-w-0 flex-1 px-3 py-2.5 text-left text-sm transition ${
                      isSelected ? "text-gray-900 font-medium" : "text-gray-700"
                    }`}
                  >
                    {p.title}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(p.id);
                    }}
                    className={`shrink-0 rounded p-1.5 transition-colors ${
                      isSelected
                        ? "text-gray-600 hover:text-red-600"
                        : "text-gray-400 hover:text-red-500"
                    }`}
                    aria-label={`${p.title} 삭제`}
                    title="발표 삭제"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" y1="11" x2="10" y2="17" />
                      <line x1="14" y1="11" x2="14" y2="17" />
                    </svg>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>
    </aside>
  );
}

/** 우측: 선택한 발표의 사전 정보 입력 폼 */
function PresentationForm({
  presentation,
  onSubmit,
  onTitleChange,
  onContextChange,
  onThemeChange,
  onAttachedFileNamesChange,
  onTimerChange,
}: {
  presentation: Presentation | null;
  onSubmit: (data: {
    context: string;
    files: File[];
    background: BackgroundTheme;
    timerTotalMinutes?: number;
    timerPhases?: number;
  }) => void;
  onTitleChange: (title: string) => void;
  onContextChange: (id: string, context: string) => void;
  onThemeChange: (id: string, background: BackgroundTheme) => void;
  onAttachedFileNamesChange: (id: string, names: string[]) => void;
  onTimerChange: (id: string, timerTotalMinutes?: number, timerPhases?: number) => void;
}) {
  const [context, setContext] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [background, setBackground] = useState<BackgroundTheme>("auto");
  const [timerTotalMinutes, setTimerTotalMinutes] = useState<string>("");
  const [timerPhases, setTimerPhases] = useState<string>("");

  const contextId = useId();
  const filesId = useId();
  const backgroundId = useId();
  const timerMinutesId = useId();
  const timerPhasesId = useId();

  useEffect(() => {
    if (presentation) {
      setContext(presentation.context);
      setBackground(presentation.background);
      setTimerTotalMinutes(
        presentation.timerTotalMinutes != null ? String(presentation.timerTotalMinutes) : ""
      );
      setTimerPhases(
        presentation.timerPhases != null ? String(presentation.timerPhases) : ""
      );
    }
  }, [
    presentation?.id,
    presentation?.context,
    presentation?.background,
    presentation?.timerTotalMinutes,
    presentation?.timerPhases,
  ]);

  if (!presentation) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-white p-8 text-center">
        <p className="text-gray-500">좌측에서 시작할 발표를 선택하세요.</p>
      </main>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalMin = timerTotalMinutes.trim() ? parseInt(timerTotalMinutes, 10) : undefined;
    const phases = timerPhases.trim() ? parseInt(timerPhases, 10) : undefined;
    onSubmit({
      context,
      files,
      background,
      timerTotalMinutes: totalMin != null && totalMin > 0 ? totalMin : undefined,
      timerPhases: phases != null && phases > 0 ? phases : undefined,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    const list = Array.from(selected);
    setFiles(list);
    onAttachedFileNamesChange(presentation.id, list.map((f) => f.name));
  };

  return (
    <main className="flex flex-1 flex-col overflow-y-auto bg-white">
      <form onSubmit={handleSubmit} className="mx-auto flex w-full max-w-xl flex-col gap-6 p-8">
        <div>
          <label htmlFor="presentation-title" className="mb-1.5 block text-sm font-medium text-gray-700">
            발표 제목
          </label>
          <input
            id="presentation-title"
            type="text"
            value={presentation.title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="발표 제목을 입력하세요"
            className="w-full rounded-lg border border-gray-200 bg-gray-50/80 px-3 py-2.5 text-lg font-semibold text-gray-900 placeholder-gray-400 transition hover:border-gray-300 hover:bg-gray-50 focus:border-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1"
            aria-label="발표 제목"
          />
        </div>

        {/* 발표에 대한 사전 정보 입력 */}
        <div>
          <label htmlFor={contextId} className="mb-1.5 block text-sm font-medium text-gray-700">
            발표에 대한 사전 정보
          </label>
          <p className="mt-1 text-sm text-gray-500">사전 정보를 입력하고 발표를 시작하세요.</p>
          <textarea
            id={contextId}
            value={context}
            onChange={(e) => {
              const v = e.target.value;
              setContext(v);
              onContextChange(presentation.id, v);
            }}
            rows={4}
            placeholder="발표 주제, 대상, 참고할 내용 등을 입력하세요."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        {/* 발표 테마 */}
        <div>
          <label htmlFor={backgroundId} className="mb-1.5 block text-sm font-medium text-gray-700">
            발표 테마
          </label>
          <div id={backgroundId} className="flex flex-wrap gap-3">
            {BACKGROUND_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className={`flex cursor-pointer flex-col overflow-hidden rounded-lg border-2 transition ${
                  background === opt.value
                    ? "border-gray-900 bg-gray-50"
                    : "border-gray-300 hover:border-gray-400"
                }`}
              >
                <input
                  type="radio"
                  name="background"
                  value={opt.value}
                  checked={background === opt.value}
                  onChange={() => {
                    setBackground(opt.value);
                    onThemeChange(presentation.id, opt.value);
                  }}
                  className="sr-only"
                />
                <span
                  className={`flex h-20 w-36 items-center justify-center shrink-0 ${
                    opt.value === "hackathon" ? "bg-black" : "bg-gray-700"
                  }`}
                >
                  {opt.value === "auto" ? (
                    <span className="text-xs text-gray-300">기본</span>
                  ) : (
                    <Image
                      src={cursorLogo}
                      alt=""
                      width={96}
                      height={32}
                      className="h-8 w-auto object-contain"
                    />
                  )}
                </span>
                <span className="border-t border-gray-200 bg-white px-3 py-2 text-center text-sm font-medium text-gray-700">
                  {opt.label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* 발표에서 활용할 자료 */}
        <div>
          <label htmlFor={filesId} className="mb-1.5 block text-sm font-medium text-gray-700">
            활용할 자료 (선택)
          </label>
          <input
            id={filesId}
            type="file"
            multiple
            accept="*/*"
            onChange={handleFileChange}
            className="w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-gray-700 file:transition hover:file:bg-gray-200"
          />
          {(files.length > 0 || presentation.attachedFileNames.length > 0) && (
            <p className="mt-1.5 text-sm text-gray-500">
              {files.length > 0
                ? `${files.length}개 파일 선택됨`
                : `이전 선택: ${presentation.attachedFileNames.join(", ")}`}
            </p>
          )}
        </div>

        {/* 타이머 설정 (선택) */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            타이머 (선택)
          </label>
          <p className="text-sm text-gray-500">
            전체 발표 시간과 Phase 수를 입력하면, 발표 화면 우측 하단에 Phase별 카운트와 총 타이머가 표시됩니다.
          </p>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[120px]">
              <label htmlFor={timerMinutesId} className="mb-1 block text-xs text-gray-500">
                전체 발표 시간 (분)
              </label>
              <input
                id={timerMinutesId}
                type="number"
                min={1}
                placeholder="예: 2"
                value={timerTotalMinutes}
                onChange={(e) => {
                  const v = e.target.value;
                  setTimerTotalMinutes(v);
                  const n = v.trim() ? parseInt(v, 10) : undefined;
                  onTimerChange(
                    presentation.id,
                    n != null && n > 0 ? n : undefined,
                    timerPhases.trim() ? parseInt(timerPhases, 10) : undefined
                  );
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
            <div className="flex-1 min-w-[120px]">
              <label htmlFor={timerPhasesId} className="mb-1 block text-xs text-gray-500">
                Phase 수
              </label>
              <input
                id={timerPhasesId}
                type="number"
                min={1}
                placeholder="예: 8"
                value={timerPhases}
                onChange={(e) => {
                  const v = e.target.value;
                  setTimerPhases(v);
                  const n = v.trim() ? parseInt(v, 10) : undefined;
                  onTimerChange(
                    presentation.id,
                    timerTotalMinutes.trim() ? parseInt(timerTotalMinutes, 10) : undefined,
                    n != null && n > 0 ? n : undefined
                  );
                }}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
              />
            </div>
          </div>
          {timerTotalMinutes && timerPhases && (
            <p className="text-xs text-gray-500">
              → Phase당 {Math.round((parseInt(timerTotalMinutes, 10) * 60) / parseInt(timerPhases, 10))}초
            </p>
          )}
        </div>

        <button
          type="submit"
          className="rounded-lg bg-gray-900 px-4 py-3 text-sm font-medium text-white transition hover:bg-gray-800"
        >
          시작하기
        </button>
      </form>
    </main>
  );
}

/** 시작 화면: 좌측 발표 선택, 우측 사전 정보 입력 */
const defaultPresentation = (id: string, title: string): Presentation => ({
  id,
  title,
  createdAt: Date.now(),
  context: "",
  background: "auto",
  attachedFileNames: [],
});

export default function StartScreen() {
  const router = useRouter();
  const [presentations, setPresentations] = useState<Presentation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    setPresentations(getStoredPresentations());
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) return;
    setStoredPresentations(presentations);
  }, [hasLoaded, presentations]);

  const selected = selectedId
    ? presentations.find((p) => p.id === selectedId) ?? null
    : null;

  const handleCreate = () => {
    const id = `p-${Date.now()}`;
    setPresentations((prev) => [
      defaultPresentation(id, `새 발표 ${prev.length + 1}`),
      ...prev,
    ]);
    setSelectedId(id);
  };

  const handleTitleChange = (title: string) => {
    if (!selectedId) return;
    setPresentations((prev) =>
      prev.map((p) => (p.id === selectedId ? { ...p, title } : p))
    );
  };

  const handleContextChange = (id: string, context: string) => {
    setPresentations((prev) =>
      prev.map((p) => (p.id === id ? { ...p, context } : p))
    );
  };

  const handleThemeChange = (id: string, background: BackgroundTheme) => {
    setPresentations((prev) =>
      prev.map((p) => (p.id === id ? { ...p, background } : p))
    );
  };

  const handleAttachedFileNamesChange = (id: string, attachedFileNames: string[]) => {
    setPresentations((prev) =>
      prev.map((p) => (p.id === id ? { ...p, attachedFileNames } : p))
    );
  };

  const handleTimerChange = (
    id: string,
    timerTotalMinutes?: number,
    timerPhases?: number
  ) => {
    setPresentations((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, timerTotalMinutes, timerPhases } : p
      )
    );
  };

  const handleDelete = (id: string) => {
    setPresentations((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleSubmit = (data: {
    context: string;
    files: File[];
    background: BackgroundTheme;
    timerTotalMinutes?: number;
    timerPhases?: number;
  }) => {
    try {
      sessionStorage.setItem("live-slide-theme", data.background);
      if (
        data.timerTotalMinutes != null &&
        data.timerTotalMinutes > 0 &&
        data.timerPhases != null &&
        data.timerPhases > 0
      ) {
        sessionStorage.setItem(
          "live-slide-timer",
          JSON.stringify({
            totalSeconds: data.timerTotalMinutes * 60,
            phases: data.timerPhases,
          })
        );
      } else {
        sessionStorage.removeItem("live-slide-timer");
      }
    } catch {
      // ignore
    }
    setIsFadingOut(true);
    setTimeout(() => {
      // TODO: 서버로 컨텍스트·파일·테마 전송
      router.push("/presentation");
    }, 500);
  };

  return (
    <div
      className="flex h-screen flex-col bg-white transition-opacity duration-500 ease-out"
      style={{ opacity: isFadingOut ? 0 : 1 }}
    >
      <header className="shrink-0 border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">Live Slide</h1>
        <p className="text-sm text-gray-600">Zero-Preparation Presentation</p>
      </header>
      <div className="flex flex-1 overflow-hidden">
        <PresentationList
          presentations={presentations}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onCreate={handleCreate}
          onDelete={handleDelete}
        />
        <PresentationForm
          presentation={selected}
          onSubmit={handleSubmit}
          onTitleChange={handleTitleChange}
          onContextChange={handleContextChange}
          onThemeChange={handleThemeChange}
          onAttachedFileNamesChange={handleAttachedFileNamesChange}
          onTimerChange={handleTimerChange}
        />
      </div>
    </div>
  );
}
