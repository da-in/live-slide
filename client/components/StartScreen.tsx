"use client";

import { useState, useId, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { PresentationSummary, BackgroundTheme } from "@/types/presentation";
import { getStoredPresentations, setStoredPresentations } from "@/lib/presentation-storage";

const BACKGROUND_OPTIONS: { value: BackgroundTheme; label: string }[] = [
  { value: "auto", label: "Auto" },
  { value: "hackathon", label: "Hackathon" },
];

/** 좌측: 발표 목록 + 발표 생성하기 */
function PresentationList({
  presentations,
  selectedId,
  onSelect,
  onCreate,
  onDelete,
}: {
  presentations: PresentationSummary[];
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
}: {
  presentation: PresentationSummary | null;
  onSubmit: (data: { context: string; files: File[]; background: BackgroundTheme }) => void;
  onTitleChange: (title: string) => void;
}) {
  const [context, setContext] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [background, setBackground] = useState<BackgroundTheme>("auto");

  const contextId = useId();
  const filesId = useId();
  const backgroundId = useId();

  if (!presentation) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-white p-8 text-center">
        <p className="text-gray-500">좌측에서 시작할 발표를 선택하세요.</p>
      </main>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ context, files, background });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files;
    if (!selected) return;
    setFiles(Array.from(selected));
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
            onChange={(e) => setContext(e.target.value)}
            rows={4}
            placeholder="발표 주제, 대상, 참고할 내용 등을 입력하세요."
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
          />
        </div>

        {/* 배경 설정 */}
        <div>
          <label htmlFor={backgroundId} className="mb-1.5 block text-sm font-medium text-gray-700">
            배경
          </label>
          <div id={backgroundId} className="flex flex-wrap gap-2">
            {BACKGROUND_OPTIONS.map((opt) => (
              <label
                key={opt.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-4 py-2.5 transition has-[:checked]:border-gray-900 has-[:checked]:bg-gray-50"
              >
                <input
                  type="radio"
                  name="background"
                  value={opt.value}
                  checked={background === opt.value}
                  onChange={() => setBackground(opt.value)}
                  className="h-4 w-4 border-gray-300 text-gray-900 focus:ring-gray-900"
                />
                <span className="text-sm text-gray-700">{opt.label}</span>
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
          {files.length > 0 && (
            <p className="mt-1.5 text-sm text-gray-500">{files.length}개 파일 선택됨</p>
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
export default function StartScreen() {
  const router = useRouter();
  const [presentations, setPresentations] = useState<PresentationSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  // 새로고침 시 localStorage에서 복원
  useEffect(() => {
    setPresentations(getStoredPresentations());
    setHasLoaded(true);
  }, []);

  // 로드 완료 후, 발표 목록이 바뀔 때마다 저장
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
      { id, title: `새 발표 ${prev.length + 1}`, createdAt: Date.now() },
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

  const handleDelete = (id: string) => {
    setPresentations((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const handleSubmit = (data: { context: string; files: File[]; background: BackgroundTheme }) => {
    setIsFadingOut(true);
    setTimeout(() => {
      // TODO: 서버로 컨텍스트·파일·배경 전송
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
        />
      </div>
    </div>
  );
}
