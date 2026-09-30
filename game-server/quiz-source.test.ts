import "./test-env";
import assert from "node:assert/strict";
import { test } from "node:test";
import { parseQuizCsv } from "./quiz-source";

const HEADER = "type,question,image,time,points,a1,a2,a3,a4,correct\n";

test("parses quiz and tf rows", () => {
  const { quiz, problems } = parseQuizCsv(
    "local:t",
    "T",
    HEADER + 'quiz,"Pick, one",,20,double,A,B,C,,"1,3"\n' + "tf,Sky is blue,,10,,,,,,TRUE\n# comment row\n\n",
  );
  assert.deepEqual(problems, []);
  assert.equal(quiz.questions.length, 2);
  assert.deepEqual(quiz.questions[0], {
    type: "quiz",
    text: "Pick, one",
    image: null,
    timeMs: 20_000,
    points: "double",
    choices: ["A", "B", "C"],
    correct: [0, 2],
  });
  assert.deepEqual(quiz.questions[1].choices, ["True", "False"]);
  assert.deepEqual(quiz.questions[1].correct, [0]);
  assert.equal(quiz.questions[1].points, "standard");
});

test("reports problems with spreadsheet row numbers", () => {
  const rows = [
    "quiz,Bad time,,7,,A,B,,,1", // row 2
    "quiz,Gap,,20,,A,,C,,1", // row 3
    "quiz,Out of range,,20,,A,B,,,3", // row 4
    "tf,Bad tf,,10,,,,,,yes", // row 5
    "mc,Bad type,,10,,A,B,,,1", // row 6
    "quiz,Bad image,http://x.png,10,,A,B,,,1", // row 7
  ];
  const { quiz, problems } = parseQuizCsv("local:t", "T", HEADER + rows.join("\n") + "\n");
  assert.equal(quiz.questions.length, 0);
  assert.deepEqual([...new Set(problems.map((p) => p.row))], [2, 3, 4, 5, 6, 7]);
});

test("missing header", () => {
  const { problems } = parseQuizCsv("local:t", "T", "a,b\n1,2\n");
  assert.equal(problems.length, 1);
});

test("empty quiz is a problem", () => {
  const { problems } = parseQuizCsv("local:t", "T", HEADER);
  assert.match(problems[0].message, /no questions/);
});
