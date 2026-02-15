import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function clamp(n: number, min: number, max: number) {
  return Math.min(Math.max(n, min), max);
}

export function toInt(s: string, fallback: number) {
  const trimmed = s.trim();
  if (trimmed === "") return fallback;
  const n = parseInt(trimmed, 10);
  return Number.isFinite(n) ? n : fallback;
}

export function digitsOnly(s: string) {
  return /^\d*$/.test(s);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
