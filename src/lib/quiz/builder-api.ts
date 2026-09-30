import { quizHttpUrl } from "@/lib/quiz/use-quiz-socket";
import type { BuilderChecked, BuilderQuiz, BuilderSaved, QuizDraft } from "../../../game-server/protocol";

// Typed wrappers for the game server's /quizzes routes (see game-server/builder-http.ts).

export class BuilderError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
}

async function call<T>(password: string, method: string, path: string, body?: unknown): Promise<T> {
  let res: Response;
  try {
    res = await fetch(quizHttpUrl(path), {
      method,
      headers: { Authorization: `Bearer ${password}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: "no-store",
    });
  } catch {
    throw new BuilderError(0, "Can't reach the game server.");
  }
  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new BuilderError(res.status, data?.error ?? `Request failed (${res.status}).`);
  return data as T;
}

const quizPath = (id: string) => `quizzes/${encodeURIComponent(id)}`;

export function builderApi(password: string) {
  return {
    get: (id: string) => call<BuilderQuiz>(password, "GET", quizPath(id)),
    create: (draft: QuizDraft) => call<BuilderSaved>(password, "POST", "quizzes", draft),
    save: (id: string, draft: QuizDraft, etag: string) => call<BuilderSaved>(password, "PUT", quizPath(id), { ...draft, etag }),
    remove: (id: string) => call<void>(password, "DELETE", quizPath(id)),
    check: (draft: QuizDraft) => call<BuilderChecked>(password, "POST", "quizzes/check", draft),
  };
}
