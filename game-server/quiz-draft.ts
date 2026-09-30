// Conversion between the builder's JSON drafts and the quiz CSV format, so
// builder quizzes are stored, listed and validated exactly like CSV quizzes.
import { parseCsv } from "./csv";
import type { DraftProblem, DraftQuestion, PointsMode, QuizDraft } from "./protocol";
import { DEFAULT_TIME, MAX_QUESTIONS, MAX_TITLE_LEN, TIME_OPTIONS } from "./quiz-rules";
import { COLUMNS, findHeader, parseQuizCsv, readTitle } from "./quiz-source";

// draftToCsv writes the title row, then the header, so question i is on row i + 3.
const FIRST_QUESTION_ROW = 3;
// Generous bound on any one field; the parser reports the real limits as problems.
const MAX_FIELD = 1000;

function cell(v: string | number) {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function draftToCsv(d: QuizDraft): string {
  const lines = [cell(`# title: ${d.title}`), COLUMNS.join(",")];
  for (const q of d.questions) {
    const tf = q.type === "tf";
    const answers = [0, 1, 2, 3].map((i) => (tf ? "" : (q.answers[i] ?? "")));
    const correct = tf ? (q.correct[0] === 0 ? "true" : q.correct[0] === 1 ? "false" : "") : q.correct.map((i) => i + 1).join(",");
    lines.push([q.type, q.text, q.image, q.time, q.points, ...answers, correct].map(cell).join(","));
  }
  return lines.join("\r\n") + "\r\n";
}

// Lenient: turns any quiz CSV (a Sheet tab, a local file, a saved quiz) into
// an editable draft. Rows the parser would reject still come through so the
// builder can show and fix them.
export function csvToDraft(csv: string, fallbackTitle: string): QuizDraft {
  const rows = parseCsv(csv);
  const title = readTitle(rows) ?? fallbackTitle;
  const h = findHeader(rows);
  if (h < 0) return { title, questions: [] };
  const header = rows[h].map((c) => c.trim().toLowerCase());
  const get = (r: string[], name: string) => {
    const i = header.indexOf(name);
    return i >= 0 ? (r[i] ?? "").trim() : "";
  };

  const questions: DraftQuestion[] = [];
  for (const r of rows.slice(h + 1)) {
    if (r.every((c) => c.trim() === "") || (r[0] ?? "").trim().startsWith("#")) continue;
    const type = get(r, "type").toLowerCase() === "tf" ? "tf" : "quiz";
    const time = Number(get(r, "time"));
    const correctRaw = get(r, "correct").toLowerCase();
    questions.push({
      type,
      text: get(r, "question"),
      image: get(r, "image"),
      time: TIME_OPTIONS.includes(time) ? time : DEFAULT_TIME,
      points: toPoints(get(r, "points").toLowerCase()),
      answers: ["a1", "a2", "a3", "a4"].map((c) => get(r, c)),
      correct:
        type === "tf"
          ? correctRaw === "true"
            ? [0]
            : correctRaw === "false"
              ? [1]
              : []
          : toCorrect(correctRaw.split(/[\s,;]+/).map((p) => Number(p) - 1)),
    });
  }
  return { title, questions };
}

function toPoints(v: unknown): PointsMode {
  return v === "double" || v === "none" ? v : "standard";
}

function toCorrect(v: unknown[]): number[] {
  return [...new Set(v.filter((n): n is number => Number.isInteger(n) && (n as number) >= 0 && (n as number) < 4))].sort();
}

// One line of text, bounded. Newlines would split a CSV row's meaning apart.
function str(v: unknown, max = MAX_FIELD) {
  return typeof v === "string" ? v.replace(/[\r\n]+/g, " ").slice(0, max) : "";
}

// Shapes untrusted request JSON into a draft, or null if it isn't one.
export function coerceDraft(v: unknown): QuizDraft | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (!Array.isArray(o.questions) || o.questions.length > MAX_QUESTIONS * 2) return null;
  const questions = o.questions.map((qv): DraftQuestion => {
    const q = (qv && typeof qv === "object" ? qv : {}) as Record<string, unknown>;
    const time = Number(q.time);
    return {
      type: q.type === "tf" ? "tf" : "quiz",
      text: str(q.text),
      image: str(q.image).trim(),
      time: Number.isInteger(time) ? time : DEFAULT_TIME,
      points: toPoints(q.points),
      answers: [0, 1, 2, 3].map((i) => str(Array.isArray(q.answers) ? q.answers[i] : "")),
      correct: toCorrect(Array.isArray(q.correct) ? q.correct : []),
    };
  });
  return { title: str(o.title, MAX_TITLE_LEN).trim() || "Untitled quiz", questions };
}

// The same checks that gate "Create game", mapped back to question indexes.
export function draftProblems(d: QuizDraft): DraftProblem[] {
  const { problems } = parseQuizCsv("draft", d.title, draftToCsv(d));
  return problems.map((p) => ({ question: p.row >= FIRST_QUESTION_ROW ? p.row - FIRST_QUESTION_ROW : null, message: p.message }));
}
