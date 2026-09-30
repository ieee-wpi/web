// Files for quizzes made in the builder: config.savedDir/<slug>.csv, one
// .bak of the previous version beside each, and deletions moved to .trash/.
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config";

export const SLUG_RE = /^[\w-]+$/;
const MAX_SAVED = 200;

const fileFor = (slug: string) => path.join(config.savedDir, `${slug}.csv`);
const etagOf = (csv: string) => crypto.createHash("sha1").update(csv).digest("hex").slice(0, 16);

export function slugify(title: string) {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60)
    .replace(/^-+|-+$/g, "");
  return slug || "quiz";
}

export function readSaved(slug: string): { csv: string; etag: string } | null {
  if (!SLUG_RE.test(slug)) return null;
  const p = fileFor(slug);
  if (!fs.existsSync(p)) return null;
  const csv = fs.readFileSync(p, "utf8");
  return { csv, etag: etagOf(csv) };
}

// The slug comes from the title once, at creation; renaming a quiz later
// never moves its file.
export function createSaved(title: string, csv: string): { slug: string; etag: string } | "full" {
  fs.mkdirSync(config.savedDir, { recursive: true });
  if (fs.readdirSync(config.savedDir).filter((f) => f.endsWith(".csv")).length >= MAX_SAVED) return "full";
  const base = slugify(title);
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    try {
      fs.writeFileSync(fileFor(slug), csv, { flag: "wx" });
      return { slug, etag: etagOf(csv) };
    } catch (err) {
      if ((err as NodeJS.ErrnoException).code !== "EEXIST") throw err;
    }
  }
}

// Refuses (conflict) when the file changed since the caller read `etag`.
export function writeSaved(slug: string, csv: string, etag: string): { etag: string } | "missing" | "conflict" {
  const current = readSaved(slug);
  if (!current) return "missing";
  if (current.etag !== etag) return "conflict";
  if (current.csv === csv) return { etag };
  const p = fileFor(slug);
  fs.writeFileSync(`${p}.bak`, current.csv);
  fs.writeFileSync(`${p}.tmp`, csv);
  fs.renameSync(`${p}.tmp`, p);
  return { etag: etagOf(csv) };
}

export function deleteSaved(slug: string): boolean {
  if (!SLUG_RE.test(slug)) return false;
  const p = fileFor(slug);
  if (!fs.existsSync(p)) return false;
  const trash = path.join(config.savedDir, ".trash");
  fs.mkdirSync(trash, { recursive: true });
  const dest = path.join(trash, `${slug}_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`);
  fs.renameSync(p, dest);
  if (fs.existsSync(`${p}.bak`)) fs.renameSync(`${p}.bak`, `${dest}.bak`);
  return true;
}
