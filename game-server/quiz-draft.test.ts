import "./test-env";
import assert from "node:assert/strict";
import { test } from "node:test";
import type { DraftQuestion, QuizDraft } from "./protocol";
import { coerceDraft, csvToDraft, draftProblems, draftToCsv } from "./quiz-draft";
import { parseQuizCsv } from "./quiz-source";

const q = (over: Partial<DraftQuestion> = {}): DraftQuestion => ({
  type: "quiz",
  text: "Q",
  image: "",
  time: 20,
  points: "standard",
  answers: ["A", "B", "", ""],
  correct: [0],
  ...over,
});

test("draft -> CSV -> quiz round-trips awkward text", () => {
  const draft: QuizDraft = {
    title: `IEEE Trivia: "Fall" '26, part 1`,
    questions: [
      q({ text: 'Pick, "one"', answers: ["=SUM(A1)", "b,c", "'quoted'", "@d"], correct: [1, 3], points: "double", time: 45 }),
      q({ type: "tf", text: "Sky is blue", correct: [1], image: "https://example.com/a.png" }),
    ],
  };
  const csv = draftToCsv(draft);
  const { quiz, problems } = parseQuizCsv("saved:x", "fallback", csv);
  assert.deepEqual(problems, []);
  assert.equal(quiz.title, draft.title);
  assert.deepEqual(quiz.questions[0].choices, ["=SUM(A1)", "b,c", "'quoted'", "@d"]);
  assert.deepEqual(quiz.questions[0].correct, [1, 3]);
  assert.equal(quiz.questions[0].timeMs, 45_000);
  assert.deepEqual(quiz.questions[1].correct, [1]);
  assert.equal(quiz.questions[1].image, "https://example.com/a.png");

  // and back into an editable draft
  const again = csvToDraft(csv, "fallback");
  assert.equal(again.title, draft.title);
  assert.deepEqual(again.questions[0], draft.questions[0]);
  assert.deepEqual(again.questions[1].correct, [1]);
});

test("CSVs without a title row keep the fallback title", () => {
  const csv = "type,question,image,time,points,a1,a2,a3,a4,correct\nquiz,Q,,20,,A,B,,,1\n";
  assert.equal(parseQuizCsv("local:x", "From file", csv).quiz.title, "From file");
  assert.equal(csvToDraft(csv, "From file").title, "From file");
});

test("csvToDraft keeps rows the parser would reject", () => {
  const csv = "type,question,image,time,points,a1,a2,a3,a4,correct\nquiz,,,7,weird,A,,C,,9\n# note\ntf,T,,10,,,,,,TRUE\n";
  const d = csvToDraft(csv, "t");
  assert.equal(d.questions.length, 2);
  assert.deepEqual(d.questions[0], q({ text: "", time: 20, answers: ["A", "", "C", ""], correct: [] }));
  assert.deepEqual(d.questions[1].correct, [0]);
});

test("problems map to question indexes", () => {
  const problems = draftProblems({ title: "t", questions: [q(), q({ text: "" }), q({ answers: ["A", "", "", ""] })] });
  assert.deepEqual([...new Set(problems.map((p) => p.question))], [1, 2]);
  assert.deepEqual(draftProblems({ title: "t", questions: [] }), [{ question: null, message: "Quiz has no questions." }]);
});

test("coerceDraft sanitizes untrusted input", () => {
  assert.equal(coerceDraft(null), null);
  assert.equal(coerceDraft({ questions: "no" }), null);
  const d = coerceDraft({
    title: "  ",
    questions: [{ type: "mc", text: "a\nb", time: "30", points: "triple", answers: [1, "x"], correct: [0, 0, 7, "1", -1] }, null],
  });
  assert.ok(d);
  assert.equal(d.title, "Untitled quiz");
  assert.deepEqual(d.questions[0], { type: "quiz", text: "a b", image: "", time: 30, points: "standard", answers: ["", "x", "", ""], correct: [0] });
  assert.equal(d.questions[1].type, "quiz");
});
