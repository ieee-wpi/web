import fs from "node:fs";
import path from "node:path";

// Minimal .env loader (KEY=value per line, # comments, optional quotes).
// Existing process.env values win, so the shell can override the file.
function loadEnvFile(file: string) {
  if (!fs.existsSync(file)) return;
  for (const raw of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

// The compiled server lives in game-server/dist; source and data live one level up.
export const ROOT = path.resolve(__dirname, "..");
loadEnvFile(path.join(ROOT, ".env"));

// Accept whatever officers paste from "Publish to web": with or without
// /pub, a /pubhtml link, or a link with ?output=csv&gid=... already on it.
export function normalizeSheetBase(raw: string) {
  const base = raw.trim().split(/[?#]/)[0].replace(/\/+$/, "");
  if (!base) return "";
  if (base.endsWith("/pub")) return base;
  if (base.endsWith("/pubhtml")) return base.slice(0, -"html".length);
  return `${base}/pub`;
}

function int(name: string, fallback: number) {
  const n = Number(process.env[name]);
  return Number.isInteger(n) && n > 0 ? n : fallback;
}

export const config = {
  port: int("QUIZ_PORT", 9001),
  hostPassword: process.env.QUIZ_HOST_PASSWORD ?? "",
  sheetPubBase: normalizeSheetBase(process.env.QUIZ_SHEET_PUB_BASE ?? ""),
  indexGid: process.env.QUIZ_INDEX_GID ?? "0",
  maxGames: int("QUIZ_MAX_GAMES", 3),
  maxPlayers: int("QUIZ_MAX_PLAYERS", 200),
  resultsDir: path.resolve(ROOT, process.env.QUIZ_RESULTS_DIR ?? "results"),
  quizzesDir: path.resolve(ROOT, process.env.QUIZ_LOCAL_DIR ?? "quizzes"),
  allowedOrigins: (process.env.QUIZ_ALLOWED_ORIGINS ?? "https://ieee.wpi.edu,https://ieee-dev.wpi.edu,http://localhost:3000")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  introMs: int("QUIZ_INTRO_MS", 4000),
};

if (!config.hostPassword) {
  console.warn("[quiz] QUIZ_HOST_PASSWORD is not set; hosting is disabled until it is.");
}
