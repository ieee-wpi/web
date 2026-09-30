// Imported first by tests: points results at a temp dir and silences the password warning.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

process.env.QUIZ_RESULTS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), "quiz-results-"));
process.env.QUIZ_HOST_PASSWORD ??= "test";
process.env.QUIZ_INTRO_MS = "50";
