import "./test-env";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { test } from "node:test";
import { config } from "./config";
import { listQuizzes, loadQuiz } from "./quiz-source";
import { createSaved, deleteSaved, readSaved, slugify, writeSaved } from "./saved-quizzes";

const CSV = (title: string, q = "Q") => `# title: ${title}\r\ntype,question,image,time,points,a1,a2,a3,a4,correct\r\nquiz,${q},,20,standard,A,B,,,1\r\n`;

test("slugify", () => {
  assert.equal(slugify("IEEE Trivia: Fall '26!"), "ieee-trivia-fall-26");
  assert.equal(slugify("???"), "quiz");
  assert.equal(slugify("x".repeat(100)).length, 60);
});

test("create, list, load, update, conflict, delete", async () => {
  const a = createSaved("My Quiz", CSV("My Quiz"));
  const b = createSaved("My Quiz", CSV("My Quiz"));
  assert.ok(a !== "full" && b !== "full");
  assert.equal(a.slug, "my-quiz");
  assert.equal(b.slug, "my-quiz-2");

  const listed = (await listQuizzes()).filter((s) => s.source === "saved");
  assert.deepEqual(
    listed.map((s) => s.id),
    ["saved:my-quiz", "saved:my-quiz-2"],
  );
  assert.equal(listed[0].title, "My Quiz");
  const { quiz, problems } = await loadQuiz("saved:my-quiz");
  assert.deepEqual(problems, []);
  assert.equal(quiz.title, "My Quiz");

  const updated = writeSaved(a.slug, CSV("Renamed", "Q2"), a.etag);
  assert.ok(typeof updated === "object");
  assert.equal(writeSaved(a.slug, CSV("Stale"), a.etag), "conflict");
  assert.equal(readSaved(a.slug)?.etag, updated.etag);
  assert.equal(fs.readFileSync(path.join(config.savedDir, "my-quiz.csv.bak"), "utf8"), CSV("My Quiz"));
  assert.equal(writeSaved("nope", CSV("x"), "e"), "missing");

  assert.equal(deleteSaved(a.slug), true);
  assert.equal(deleteSaved(a.slug), false);
  assert.equal(readSaved(a.slug), null);
  const trashed = fs.readdirSync(path.join(config.savedDir, ".trash"));
  assert.equal(trashed.filter((f) => f.endsWith(".csv")).length, 1);
  assert.equal(trashed.filter((f) => f.endsWith(".bak")).length, 1);
});

test("slugs that could escape the directory are rejected", () => {
  for (const bad of ["../x", "..", "a/b", "a\\b", "", "%2F"]) {
    assert.equal(readSaved(bad), null);
    assert.equal(deleteSaved(bad), false);
  }
});
