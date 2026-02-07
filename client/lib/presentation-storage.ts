import type { PresentationSummary } from "@/types/presentation";

const STORAGE_KEY = "live-slide:presentations";

function isPresentationSummary(value: unknown): value is PresentationSummary {
  return (
    typeof value === "object" &&
    value !== null &&
    "id" in value &&
    "title" in value &&
    "createdAt" in value &&
    typeof (value as PresentationSummary).id === "string" &&
    typeof (value as PresentationSummary).title === "string" &&
    typeof (value as PresentationSummary).createdAt === "number"
  );
}

export function getStoredPresentations(): PresentationSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isPresentationSummary);
  } catch {
    return [];
  }
}

export function setStoredPresentations(presentations: PresentationSummary[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(presentations));
  } catch {
    // quota exceeded or disabled
  }
}
