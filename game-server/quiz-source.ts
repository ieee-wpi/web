import fs from "node:fs";
import path from "node:path";
import { config } from "./config";
import { parseCsv } from "./csv";
import type { PointsMode, QuestionType, QuizProblem, QuizSummary } from "./protocol";

export type Question = {
  type: QuestionType;
  text: string;
  image: string | null;
  timeMs: number;
  points: PointsMode;
  choices: string[];
  correct: number[]; // 0-based indexes into choices
};

export type Quiz = { id: string; title: string; questions: Question[] };

export const TIME_OPTIONS = [5, 10, 20, 30, 45, 60, 90, 120, 240];
const MAX_QUESTIONS = 100;
const MAX_QUESTION_LEN = 120;
const MAX_ANSWER_LEN = 75;
const COLUMNS = ["type", "question", "image", "time", "points", "a1", "a2", "a3", "a4", "correct"] as const;

// ---------- parsing ----------

export function parseQuizCsv(id: string, title: string, csv: string): { quiz: Quiz; problems: QuizProblem[] } {
  const rows = parseCsv(csv);
  const problems: QuizProblem[] = [];
  const questions: Question[] = [];

  const headerIdx = rows.findIndex((r) => r.some((c) => c.trim().toLowerCase() === "question"));
  if (headerIdx < 0) {
    return { quiz: { id, title, questions }, problems: [{ row: 1, message: 'No header row with a "question" column.' }] };
  }
  const header = rows[headerIdx].map((c) => c.trim().toLowerCase());
  const col: Record<string, number> = {};
  for (const name of COLUMNS) col[name] = header.indexOf(name);
  for (const required of ["question", "correct"]) {
    if (col[required] < 0) problems.push({ row: headerIdx + 1, message: `Missing "${required}" column.` });
  }
  if (problems.length) return { quiz: { id, title, questions }, problems };

  const get = (r: string[], name: string) => (col[name] >= 0 ? (r[col[name]] ?? "").trim() : "");

  for (let i = headerIdx + 1; i < rows.length; i++) {
    const r = rows[i];
    const rowNum = i + 1; // 1-based, matches the spreadsheet
    if (r.every((c) => c.trim() === "")) continue;
    if ((r[0] ?? "").trim().startsWith("#")) continue;

    const errs: string[] = [];
    const type = (get(r, "type").toLowerCase() || "quiz") as QuestionType;
    if (type !== "quiz" && type !== "tf") errs.push(`type must be "quiz" or "tf", got "${get(r, "type")}"`);

    const text = get(r, "question");
    if (!text) errs.push("question is empty");
    else if (text.length > MAX_QUESTION_LEN) errs.push(`question is ${text.length} chars (max ${MAX_QUESTION_LEN})`);

    const image = get(r, "image") || null;
    if (image && !/^https:\/\/\S+$/i.test(image) && !/^\/quiz\/img\/[\w./-]+$/.test(image)) {
      errs.push("image must be an https:// URL or a /quiz/img/... path");
    }

    const timeRaw = get(r, "time") || "20";
    const time = Number(timeRaw);
    if (!TIME_OPTIONS.includes(time)) errs.push(`time must be one of ${TIME_OPTIONS.join(", ")}`);

    const points = (get(r, "points").toLowerCase() || "standard") as PointsMode;
    if (!["standard", "double", "none"].includes(points)) errs.push('points must be "standard", "double" or "none"');

    let choices: string[] = [];
    let correct: number[] = [];
    const correctRaw = get(r, "correct").toLowerCase();

    if (type === "tf") {
      choices = ["True", "False"];
      if (correctRaw === "true") correct = [0];
      else if (correctRaw === "false") correct = [1];
      else errs.push('correct must be "true" or "false" for a tf question');
    } else if (type === "quiz") {
      // Keep answer positions as written so "correct" indexes match the sheet,
      // but require the filled ones to be contiguous from a1.
      const raw = ["a1", "a2", "a3", "a4"].map((c) => get(r, c));
      const lastFilled = raw.map((a) => a !== "").lastIndexOf(true);
      choices = raw.slice(0, lastFilled + 1);
      if (choices.length < 2) errs.push("needs at least two answers (a1, a2)");
      if (choices.some((a) => a === "")) errs.push("answers must be filled in order with no gaps");
      const long = choices.find((a) => a.length > MAX_ANSWER_LEN);
      if (long) errs.push(`answer "${long.slice(0, 20)}..." is over ${MAX_ANSWER_LEN} chars`);

      const parts = correctRaw.split(/[\s,;]+/).filter(Boolean);
      correct = [...new Set(parts.map((p) => Number(p) - 1))];
      if (parts.length === 0) errs.push("correct is empty (use answer numbers like 2 or 1,3)");
      else if (correct.some((n) => !Number.isInteger(n) || n < 0 || n >= choices.length)) {
        errs.push(`correct "${get(r, "correct")}" must list answer numbers between 1 and ${choices.length}`);
      }
    }

    if (errs.length) {
      for (const message of errs) problems.push({ row: rowNum, message });
      continue;
    }
    questions.push({ type, text, image, timeMs: time * 1000, points, choices, correct: correct.sort() });
  }

  if (questions.length === 0 && problems.length === 0) problems.push({ row: headerIdx + 1, message: "Quiz has no questions." });
  if (questions.length > MAX_QUESTIONS) {
    problems.push({ row: headerIdx + 1, message: `Quiz has ${questions.length} questions (max ${MAX_QUESTIONS}).` });
  }
  return { quiz: { id, title, questions }, problems };
}

// ---------- sources ----------

const CACHE_MS = 60_000;
const cache = new Map<string, { at: number; text: string }>();

async function fetchSheetCsv(gid: string): Promise<string> {
  const url = `${config.sheetPubBase}?gid=${encodeURIComponent(gid)}&single=true&output=csv`;
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < CACHE_MS) return hit.text;
  const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Google Sheets returned ${res.status}`);
  const text = await res.text();
  if (text.trimStart().startsWith("<")) throw new Error("Sheet is not published as CSV");
  cache.set(url, { at: Date.now(), text });
  return text;
}

async function listSheetQuizzes(): Promise<(QuizSummary & { gid: string })[]> {
  if (!config.sheetPubBase) return [];
  const rows = parseCsv(await fetchSheetCsv(config.indexGid));
  const header = (rows[0] ?? []).map((c) => c.trim().toLowerCase());
  const ti = header.indexOf("title");
  const gi = header.indexOf("gid");
  const ei = header.indexOf("enabled");
  if (ti < 0 || gi < 0) throw new Error('Index tab needs "title" and "gid" columns');
  return rows
    .slice(1)
    .filter((r) => /^\d+$/.test((r[gi] ?? "").trim()))
    .filter((r) => ei < 0 || (r[ei] ?? "").trim().toUpperCase() !== "FALSE")
    .map((r) => ({ id: `sheet:${r[gi].trim()}`, gid: r[gi].trim(), title: (r[ti] ?? "").trim() || `Quiz ${r[gi]}`, source: "sheet" as const }));
}

function listLocalQuizzes(): QuizSummary[] {
  if (!fs.existsSync(config.quizzesDir)) return [];
  return fs
    .readdirSync(config.quizzesDir)
    .filter((f) => /^[\w-]+\.csv$/.test(f))
    .map((f) => {
      const name = f.replace(/\.csv$/, "");
      return { id: `local:${name}`, title: name.replace(/[_-]+/g, " "), source: "local" as const };
    });
}

export async function listQuizzes(): Promise<QuizSummary[]> {
  let sheet: QuizSummary[] = [];
  try {
    sheet = (await listSheetQuizzes()).map(({ id, title, source }) => ({ id, title, source }));
  } catch (err) {
    console.warn("[quiz] could not read sheet index:", (err as Error).message);
  }
  return [...sheet, ...listLocalQuizzes()];
}

export async function loadQuiz(id: string): Promise<{ quiz: Quiz; problems: QuizProblem[] }> {
  const local = /^local:([\w-]+)$/.exec(id);
  if (local) {
    const file = path.join(config.quizzesDir, `${local[1]}.csv`);
    if (!fs.existsSync(file)) throw new Error("Quiz file not found");
    return parseQuizCsv(id, local[1].replace(/[_-]+/g, " "), fs.readFileSync(file, "utf8"));
  }
  const sheet = /^sheet:(\d+)$/.exec(id);
  if (sheet && config.sheetPubBase) {
    const entry = (await listSheetQuizzes()).find((q) => q.gid === sheet[1]);
    if (!entry) throw new Error("Quiz is not listed (or not enabled) in the Index tab");
    return parseQuizCsv(id, entry.title, await fetchSheetCsv(entry.gid));
  }
  throw new Error("Unknown quiz");
}
