// Wire protocol shared by the game server and the /quiz pages.
// Type-only: the front end imports this with `import type`, so nothing here
// may emit runtime code.

export type QuestionType = "quiz" | "tf";
export type PointsMode = "standard" | "double" | "none";

export type Phase = "lobby" | "intro" | "open" | "reveal" | "scoreboard" | "podium" | "ended";

export type QuizSummary = { id: string; title: string; source: "sheet" | "local" };

export type QuizProblem = { row: number; message: string };

export type PlayerInfo = { id: string; name: string; connected: boolean };

export type Standing = { id: string; name: string; score: number; delta: number; streak: number; rank: number };

export type ErrorCode =
  | "BAD_PASSWORD"
  | "BAD_PIN"
  | "BAD_TOKEN"
  | "LOCKED"
  | "FULL"
  | "NAME_TAKEN"
  | "NAME_REJECTED"
  | "RATE"
  | "TOO_MANY_GAMES"
  | "QUIZ_INVALID"
  | "QUIZ_UNAVAILABLE"
  | "BAD_REQUEST";

// ---------- client -> server ----------

export type HostSettings = { nameGenerator: boolean; autoplay: boolean };

export type ClientMessage =
  | { t: "host:listQuizzes"; password: string }
  | { t: "host:validate"; password: string; quizId: string }
  | { t: "host:create"; password: string; quizId: string; settings: HostSettings }
  | { t: "host:resume"; pin: string; hostToken: string }
  | { t: "host:start" }
  | { t: "host:next" }
  | { t: "host:skip" }
  | { t: "host:kick"; playerId: string }
  | { t: "host:lock"; locked: boolean }
  | { t: "host:end" }
  | { t: "player:checkPin"; pin: string }
  | { t: "player:join"; pin: string; name: string }
  | { t: "player:resume"; pin: string; token: string }
  | { t: "player:answer"; q: number; choice: number };

// ---------- server -> host ----------

export type HostMessage =
  | { t: "host:quizzes"; quizzes: QuizSummary[] }
  | { t: "host:validated"; quizId: string; title: string; count: number; problems: QuizProblem[] }
  | { t: "host:created"; pin: string; hostToken: string; title: string; count: number; settings: HostSettings; images: string[] }
  | { t: "lobby"; players: PlayerInfo[]; locked: boolean }
  | { t: "intro"; q: number; total: number; text: string; image: string | null; type: QuestionType; timeMs: number; points: PointsMode; introMs: number }
  | { t: "open"; q: number; total: number; text: string; image: string | null; choices: string[]; remainingMs: number; timeMs: number }
  | { t: "progress"; answered: number; total: number }
  | { t: "reveal"; q: number; total: number; text: string; image: string | null; choices: string[]; correct: number[]; dist: number[] }
  | { t: "scoreboard"; q: number; total: number; top: Standing[] }
  | { t: "podium"; top: Standing[]; count: number; resultsFile: string | null }
  | { t: "ended" }
  | { t: "error"; code: ErrorCode; message: string };

// ---------- server -> player ----------

export type PlayerMessage =
  | { t: "player:pinOk"; pin: string; nameGenerator: boolean; suggestion: string }
  | { t: "player:joined"; pin: string; token: string; id: string; name: string }
  | { t: "p:lobby"; name: string }
  | { t: "p:intro"; q: number; total: number; nChoices: number; type: QuestionType; introMs: number }
  | { t: "p:open"; q: number; total: number; nChoices: number; type: QuestionType; remainingMs: number; timeMs: number }
  | { t: "p:ack"; q: number }
  | {
      t: "p:result";
      q: number;
      total: number;
      answered: boolean;
      correct: boolean;
      points: number;
      streak: number;
      score: number;
      rank: number;
      count: number;
      behind: { name: string; gap: number } | null;
    }
  | { t: "p:final"; rank: number; score: number; count: number }
  | { t: "p:ended" }
  | { t: "kicked" }
  | { t: "error"; code: ErrorCode; message: string };

export type ServerMessage = HostMessage | PlayerMessage;
