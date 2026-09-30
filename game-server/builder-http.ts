// HTTP API for the quiz builder on /quiz/host. JSON over plain requests
// rather than the socket, whose 1 KB message cap is far below a quiz.
//
//   GET    /quizzes/:id        -> BuilderQuiz (any source; only saved: is editable)
//   POST   /quizzes            -> 201 BuilderSaved (creates a saved: quiz)
//   PUT    /quizzes/saved:slug -> BuilderSaved, or 409 if the etag is stale
//   DELETE /quizzes/saved:slug -> 204 (moves the file to .trash/)
//   POST   /quizzes/check      -> BuilderChecked (validates without saving)
//
// Every route needs "Authorization: Bearer <host password>".
import type http from "node:http";
import { checkPassword } from "./auth";
import { config } from "./config";
import type { BuilderChecked, BuilderQuiz, BuilderSaved, QuizDraft } from "./protocol";
import { coerceDraft, csvToDraft, draftProblems, draftToCsv } from "./quiz-draft";
import { loadQuizSource } from "./quiz-source";
import { KeyedLimiter } from "./rate-limit";
import { createSaved, deleteSaved, readSaved, writeSaved } from "./saved-quizzes";

const MAX_BODY = 256 * 1024;

// A builder session sends a debounced check per edit, so a correct password
// gets a loose limit. Wrong passwords spend the strict one, and once it is
// empty every request from that IP is refused, right password or not.
export const builderLimiter = new KeyedLimiter(60, 2);
export const builderBadPasswordLimiter = new KeyedLimiter(10, 10 / 60);

class HttpError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  res.writeHead(status, { "Content-Type": "application/json", "Cache-Control": "no-store" });
  res.end(body === undefined ? undefined : JSON.stringify(body));
}

function readBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    if (!/^application\/json\b/i.test(req.headers["content-type"] ?? "")) return reject(new HttpError(415, "Expected JSON."));
    if (Number(req.headers["content-length"]) > MAX_BODY) return reject(new HttpError(413, "Quiz is too large."));
    const chunks: Buffer[] = [];
    let size = 0;
    req.on("data", (c: Buffer) => {
      size += c.length;
      if (size <= MAX_BODY) chunks.push(c);
    });
    req.on("end", () => {
      if (size > MAX_BODY) return reject(new HttpError(413, "Quiz is too large."));
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")));
      } catch {
        reject(new HttpError(400, "Malformed JSON."));
      }
    });
    req.on("error", reject);
  });
}

async function readDraft(req: http.IncomingMessage): Promise<{ draft: QuizDraft; body: Record<string, unknown> }> {
  const body = await readBody(req);
  const draft = coerceDraft(body);
  if (!draft) throw new HttpError(400, "Not a quiz.");
  return { draft, body: body as Record<string, unknown> };
}

const slugOf = (id: string) => /^saved:([\w-]+)$/.exec(id)?.[1] ?? null;

export async function handleBuilder(req: http.IncomingMessage, res: http.ServerResponse, url: URL, ip: string) {
  try {
    const origin = req.headers.origin;
    if (origin && !config.allowedOrigins.includes(origin)) throw new HttpError(403, "Forbidden.");
    if (builderBadPasswordLimiter.blocked(ip) || !builderLimiter.take(ip)) throw new HttpError(429, "Too many requests. Wait a minute.");
    const token = /^Bearer (.+)$/.exec(req.headers.authorization ?? "")?.[1];
    if (!checkPassword(token)) {
      builderBadPasswordLimiter.take(ip);
      throw new HttpError(403, "Wrong host password.");
    }

    const m = /^\/quizzes(?:\/([^/]+))?\/?$/.exec(url.pathname);
    if (!m) throw new HttpError(404, "Not found.");
    let id: string | null = null;
    try {
      id = m[1] === undefined ? null : decodeURIComponent(m[1]);
    } catch {
      throw new HttpError(400, "Bad quiz id.");
    }

    if (id === "check" && req.method === "POST") {
      const { draft } = await readDraft(req);
      return sendJson(res, 200, { problems: draftProblems(draft) } satisfies BuilderChecked);
    }

    if (id === null) {
      if (req.method !== "POST") throw new HttpError(405, "Method not allowed.");
      const { draft } = await readDraft(req);
      const created = createSaved(draft.title, draftToCsv(draft));
      if (created === "full") throw new HttpError(507, "Too many saved quizzes. Delete some first.");
      console.log(`[quiz] builder created saved:${created.slug}`);
      return sendJson(res, 201, { id: `saved:${created.slug}`, etag: created.etag, problems: draftProblems(draft) } satisfies BuilderSaved);
    }

    const slug = slugOf(id);

    if (req.method === "GET") {
      if (slug) {
        const saved = readSaved(slug);
        if (!saved) throw new HttpError(404, "That quiz no longer exists.");
        const draft = csvToDraft(saved.csv, slug.replace(/[_-]+/g, " "));
        return sendJson(res, 200, { ...draft, id, editable: true, etag: saved.etag } satisfies BuilderQuiz);
      }
      let source;
      try {
        source = await loadQuizSource(id);
      } catch (err) {
        throw new HttpError(404, (err as Error).message);
      }
      return sendJson(res, 200, { ...csvToDraft(source.csv, source.title), id, editable: false, etag: null } satisfies BuilderQuiz);
    }

    if (!slug) throw new HttpError(405, "Only quizzes made in the builder can be changed here.");

    if (req.method === "PUT") {
      const { draft, body } = await readDraft(req);
      if (typeof body.etag !== "string") throw new HttpError(400, "Missing etag.");
      const result = writeSaved(slug, draftToCsv(draft), body.etag);
      if (result === "missing") throw new HttpError(404, "That quiz no longer exists.");
      if (result === "conflict") throw new HttpError(409, "Someone else saved this quiz after you opened it.");
      return sendJson(res, 200, { id, etag: result.etag, problems: draftProblems(draft) } satisfies BuilderSaved);
    }

    if (req.method === "DELETE") {
      if (!deleteSaved(slug)) throw new HttpError(404, "That quiz no longer exists.");
      console.log(`[quiz] builder deleted ${id}`);
      res.writeHead(204, { "Cache-Control": "no-store" });
      return res.end();
    }

    throw new HttpError(405, "Method not allowed.");
  } catch (err) {
    if (err instanceof HttpError) return sendJson(res, err.status, { error: err.message });
    console.error("[quiz] builder error:", err);
    return sendJson(res, 500, { error: "Something went wrong." });
  }
}
