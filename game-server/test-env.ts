// Imported first by tests: points results and saved quizzes at temp dirs and silences the password warning.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.QUIZ_RESULTS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "quiz-results-"));
process.env.QUIZ_SAVED_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "quiz-saved-"));
process.env.QUIZ_SHEET_PUB_BASE = ""; // never fetch the real sheet from tests
process.env.QUIZ_HOST_PASSWORD ??= "test";
process.env.QUIZ_INTRO_MS = "50";
