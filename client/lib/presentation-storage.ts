import type { Presentation, BackgroundTheme } from "@/types/presentation";

const STORAGE_KEY = "live-slide:presentations";
export const THEME_STORAGE_KEY = "live-slide-theme";

function normalizePresentation(raw: unknown): Presentation | null {
  if (!raw || typeof raw !== "object" || !("id" in raw) || !("title" in raw) || !("createdAt" in raw))
    return null;
  const o = raw as Record<string, unknown>;
  const id = o.id;
  const title = o.title;
  const createdAt = o.createdAt;
  if (typeof id !== "string" || typeof title !== "string" || typeof createdAt !== "number")
    return null;
  const context = typeof o.context === "string" ? o.context : "";
  const background = o.background === "hackathon" ? "hackathon" : "auto";
  const attachedFileNames = Array.isArray(o.attachedFileNames)
    ? (o.attachedFileNames as unknown[]).filter((x): x is string => typeof x === "string")
    : [];
  return { id, title, createdAt, context, background, attachedFileNames };
}

export function getStoredPresentations(): Presentation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalizePresentation).filter((p): p is Presentation => p !== null);
  } catch {
    return [];
  }
}

export function setStoredPresentations(presentations: Presentation[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presentations));
  } catch {
    // quota exceeded or disabled
  }
}
