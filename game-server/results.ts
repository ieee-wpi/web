import fs from "node:fs";
import path from "node:path";
import { config } from "./config";

export const RESULTS_FILE_RE = /^\d{4}-\d{2}-\d{2}_\d{4}_\d{6}\.(json|csv)$/;

export type ResultsPlayer = {
  rank: number;
  name: string;
  score: number;
  correctCount: number;
  avgCorrectMs: number | null;
  answers: ({ choice: number; ms: number; correct: boolean; points: number } | null)[];
};

export type Results = {
  pin: string;
  quizId: string;
  title: string;
  startedAt: string;
  finishedAt: string;
  questions: { text: string; choices: string[]; correct: number[] }[];
  players: ResultsPlayer[];
};

function csvCell(v: string | number | null) {
  const s = v === null ? "" : String(v);
  // Quote everything textual; prefix formula-looking cells so Excel doesn't evaluate them.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s;
  return /[",\n\r]/.test(safe) || safe !== s ? `"${safe.replace(/"/g, '""')}"` : safe;
}

// Writes <stamp>_<pin>.json and .csv; returns the CSV file name (or null on failure,
// which is logged but never interrupts the game).
export function writeResults(r: Results): string | null {
  try {
    fs.mkdirSync(config.resultsDir, { recursive: true });
    const d = new Date(r.finishedAt);
    const pad = (n: number) => String(n).padStart(2, "0");
    const stamp = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`;
    const base = `${stamp}_${r.pin}`;
    fs.writeFileSync(path.join(config.resultsDir, `${base}.json`), JSON.stringify(r, null, 2));
    const lines = [
      ["rank", "name", "score", "correct", "questions", "avg_correct_ms"].join(","),
      ...r.players.map((p) =>
        [p.rank, csvCell(p.name), p.score, p.correctCount, r.questions.length, p.avgCorrectMs === null ? "" : Math.round(p.avgCorrectMs)].join(","),
      ),
    ];
    fs.writeFileSync(path.join(config.resultsDir, `${base}.csv`), lines.join("\r\n") + "\r\n");
    return `${base}.csv`;
  } catch (err) {
    console.error("[quiz] failed to write results:", err);
    return null;
  }
}

export function listResults(): string[] {
  if (!fs.existsSync(config.resultsDir)) return [];
  return fs
    .readdirSync(config.resultsDir)
    .filter((f) => RESULTS_FILE_RE.test(f) && f.endsWith(".csv"))
    .sort()
    .reverse();
}

export function resultsPath(file: string): string | null {
  if (!RESULTS_FILE_RE.test(file)) return null;
  const p = path.join(config.resultsDir, file);
  return fs.existsSync(p) ? p : null;
}
