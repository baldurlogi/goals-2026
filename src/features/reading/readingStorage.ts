// src/features/reading/readingStorage.ts
import type { ReadingInputs } from "./readingTypes";

const STORAGE_KEY = "daily-life:reading:v2";

// ✅ add this
export const READING_CHANGED_EVENT = "daily-life:reading:changed";
function emitReadingChanged() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(READING_CHANGED_EVENT));
  }
}

export const DEFAULT_READING_INPUTS: ReadingInputs = {
  current: { title: "", author: "", currentPage: "", totalPages: "" },
  upNext: [],
  completed: [],
  dailyGoalPages: "20",
};

export function loadReadingInputs(): ReadingInputs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<ReadingInputs>;
      return {
        ...DEFAULT_READING_INPUTS,
        ...parsed,
        current: { ...DEFAULT_READING_INPUTS.current, ...(parsed.current ?? {}) },
        upNext: Array.isArray(parsed.upNext) ? parsed.upNext : [],
        completed: Array.isArray(parsed.completed) ? parsed.completed : [],
      };
    }

    const oldRaw = localStorage.getItem("daily-life:reading:v1");
    if (!oldRaw) return DEFAULT_READING_INPUTS;

    const oldParsed = JSON.parse(oldRaw) as any;

    const migrated: ReadingInputs = {
      ...DEFAULT_READING_INPUTS,
      current: {
        ...DEFAULT_READING_INPUTS.current,
        ...(oldParsed.current ?? {}),
      },
      dailyGoalPages:
        typeof oldParsed.dailyGoalPages === "string"
          ? oldParsed.dailyGoalPages
          : DEFAULT_READING_INPUTS.dailyGoalPages,
      upNext:
        oldParsed?.next && typeof oldParsed.next === "object"
          ? [
              {
                title: String(oldParsed.next.title ?? ""),
                author: String(oldParsed.next.author ?? ""),
                totalPages: String(oldParsed.next.totalPages ?? ""),
              },
            ]
          : [],
      completed: [],
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
    return migrated;
  } catch {
    return DEFAULT_READING_INPUTS;
  }
}

export function saveReadingInputs(value: ReadingInputs) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  // ✅ add this
  emitReadingChanged();
}

export function resetReadingInputs() {
  saveReadingInputs(DEFAULT_READING_INPUTS);
  return DEFAULT_READING_INPUTS;
}
