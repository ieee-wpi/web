import type { PointsMode } from "./protocol";

export const STREAK_STEP = 100;
export const STREAK_CAP = 500;

export function basePoints(mode: PointsMode) {
  return mode === "double" ? 2000 : mode === "none" ? 0 : 1000;
}

// Kahoot's documented formula: a correct answer scores between base (instant)
// and base/2 (at the buzzer). Wrong answers score nothing.
export function questionPoints(correct: boolean, ms: number, limitMs: number, base: number) {
  if (!correct || base === 0 || limitMs <= 0) return 0;
  const t = Math.min(Math.max(ms, 0), limitMs);
  return Math.round((1 - t / limitMs / 2) * base);
}

// Bonus for the Nth consecutive correct answer: 0, 100, 200, ... capped at 500.
export function streakBonus(streakAfter: number) {
  return streakAfter <= 1 ? 0 : Math.min((streakAfter - 1) * STREAK_STEP, STREAK_CAP);
}

export type Rankable = { score: number; totalCorrectMs: number; joinOrder: number };

// Higher score first; ties go to whoever was faster across their correct
// answers, then to whoever joined first.
export function compareStanding(a: Rankable, b: Rankable) {
  return b.score - a.score || a.totalCorrectMs - b.totalCorrectMs || a.joinOrder - b.joinOrder;
}
