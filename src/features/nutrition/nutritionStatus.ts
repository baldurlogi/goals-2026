import type { Macros } from "./nutritionTypes";

export type MacroKey = keyof Macros;
export type MacroStatus = "neutral" | "success" | "warning" | "danger";

type SuccessWindow = {
  minPct: number;
  maxPct: number;
};

const SUCCESS_WINDOWS: Record<MacroKey, SuccessWindow> = {
  cal: { minPct: 0.9, maxPct: 1.1 },
  protein: { minPct: 0.85, maxPct: 1.3 },
  carbs: { minPct: 0.85, maxPct: 1.15 },
  fat: { minPct: 0.85, maxPct: 1.15 },
};

export function getMacroSuccessWindow(key: MacroKey, target: number) {
  const window = SUCCESS_WINDOWS[key];

  return {
    min: target * window.minPct,
    max: target * window.maxPct,
  };
}

export function isMacroSuccessful(key: MacroKey, value: number, target: number) {
  if (target <= 0) return false;

  const { min, max } = getMacroSuccessWindow(key, target);
  return value >= min && value <= max;
}

export function getMacroStatus(key: MacroKey, value: number, target: number): MacroStatus {
  if (target <= 0) return "neutral";
  if (isMacroSuccessful(key, value, target)) return "success";

  const { min } = getMacroSuccessWindow(key, target);
  const isBelowRange = value < min;

  if (key === "protein") {
    return isBelowRange ? "danger" : "warning";
  }

  return isBelowRange ? "warning" : "danger";
}
