import crypto from "node:crypto";
import { config } from "./config";
import { checkName, generateName, nameKey } from "./names";
import type {
  ErrorCode,
  HostMessage,
  HostSettings,
  Phase,
  PlayerInfo,
  PlayerMessage,
  Standing,
} from "./protocol";
import type { Quiz } from "./quiz-source";
import { writeResults, type ResultsPlayer } from "./results";
import { basePoints, compareStanding, questionPoints, streakBonus } from "./scoring";

// Transport-agnostic connection so tests can drive a Game without sockets.
export interface Conn {
  send(msg: HostMessage | PlayerMessage): void;
  close(): void;
}

type Answer = { choice: number; ms: number; correct: boolean; points: number };

type ResultMsg = Extract<PlayerMessage, { t: "p:result" }>;

export type Player = {
  id: string;
  token: string;
  name: string;
  joinOrder: number;
  score: number;
  streak: number;
  lastDelta: number;
  totalCorrectMs: number;
  answers: (Answer | null)[];
  conn: Conn | null;
  lastResult: ResultMsg | null;
};

export const ANSWER_GRACE_MS = 300;
export const AUTOPLAY_MS = 5000;
const PROGRESS_THROTTLE_MS = 250;

export const randomToken = () => crypto.randomBytes(16).toString("base64url");

export class Game {
  readonly createdAt = Date.now();
  startedAt: number | null = null;
  lastActivity = Date.now();
  endedAt: number | null = null;

  phase: Phase = "lobby";
  qIndex = -1;
  locked = false;
  host: Conn | null = null;

  private players = new Map<string, Player>(); // by token
  private banned = new Set<string>();
  private joinCounter = 0;

  private timer: NodeJS.Timeout | null = null;
  private progressTimer: NodeJS.Timeout | null = null;
  private phaseEndsAt = 0; // intro/open deadline, for resume snapshots
  private openedAt = 0;
  private hostView: HostMessage | null = null; // last phase message, replayed on host resume
  private resultsFile: string | null = null;

  constructor(
    readonly pin: string,
    readonly hostToken: string,
    readonly quiz: Quiz,
    readonly settings: HostSettings,
    private readonly now: () => number = () => performance.now(),
  ) {}

  get total() {
    return this.quiz.questions.length;
  }
  get question() {
    return this.quiz.questions[this.qIndex];
  }
  get playerCount() {
    return this.players.size;
  }

  // ---------- host ----------

  attachHost(conn: Conn) {
    if (this.host && this.host !== conn) this.host.close();
    this.host = conn;
    this.touch();
    this.sendHostSnapshot();
  }

  detach(conn: Conn) {
    if (this.host === conn) this.host = null;
    for (const p of this.players.values()) {
      if (p.conn === conn) {
        p.conn = null;
        this.sendLobby();
        // The dropped player may have been the last one we were waiting on.
        this.maybeCloseEarly();
      }
    }
  }

  start() {
    if (this.phase !== "lobby" || this.players.size === 0) return;
    this.startedAt = Date.now();
    this.beginQuestion(0);
  }

  next() {
    this.touch();
    if (this.phase === "reveal") {
      if (this.qIndex >= this.total - 1) this.podium();
      else this.showScoreboard();
    } else if (this.phase === "scoreboard") {
      this.beginQuestion(this.qIndex + 1);
    } else if (this.phase === "intro") {
      this.openQuestion();
    } else if (this.phase === "podium") {
      this.end();
    }
  }

  skip() {
    if (this.phase === "open") this.closeQuestion();
    else if (this.phase === "intro") this.openQuestion();
  }

  kick(playerId: string) {
    for (const p of this.players.values()) {
      if (p.id !== playerId) continue;
      this.players.delete(p.token);
      this.banned.add(p.token);
      p.conn?.send({ t: "kicked" });
      p.conn?.close();
      this.sendLobby();
      if (this.phase === "open") this.maybeCloseEarly();
      return;
    }
  }

  setLocked(locked: boolean) {
    this.locked = locked;
    this.sendLobby();
  }

  end() {
    if (this.phase === "ended") return;
    if (this.startedAt !== null && this.phase !== "podium" && this.phase !== "lobby") this.saveResults();
    this.clearTimer();
    this.phase = "ended";
    this.endedAt = Date.now();
    this.hostView = { t: "ended" };
    this.host?.send(this.hostView);
    for (const p of this.players.values()) p.conn?.send({ t: "p:ended" });
  }

  dispose() {
    this.clearTimer();
    if (this.progressTimer) clearTimeout(this.progressTimer);
  }

  // ---------- players ----------

  isNameTaken(name: string) {
    const key = nameKey(name);
    for (const p of this.players.values()) if (nameKey(p.name) === key) return true;
    return false;
  }

  suggestName() {
    return generateName((n) => this.isNameTaken(n));
  }

  canJoin(): ErrorCode | null {
    if (this.phase === "podium" || this.phase === "ended") return "BAD_PIN";
    if (this.locked) return "LOCKED";
    if (this.players.size >= config.maxPlayers) return "FULL";
    return null;
  }

  join(conn: Conn, rawName: unknown): Player | { error: ErrorCode; message: string } {
    const blocked = this.canJoin();
    if (blocked) return { error: blocked, message: blocked === "LOCKED" ? "This game is locked." : blocked === "FULL" ? "This game is full." : "That game has ended." };
    const check = checkName(rawName);
    if (!check.ok) return { error: "NAME_REJECTED", message: check.reason };
    if (this.isNameTaken(check.name)) return { error: "NAME_TAKEN", message: "Someone already has that nickname." };

    const player: Player = {
      id: crypto.randomBytes(6).toString("base64url"),
      token: randomToken(),
      name: check.name,
      joinOrder: this.joinCounter++,
      score: 0,
      streak: 0,
      lastDelta: 0,
      totalCorrectMs: 0,
      answers: new Array(this.total).fill(null),
      conn,
      lastResult: null,
    };
    this.players.set(player.token, player);
    this.touch();
    conn.send({ t: "player:joined", pin: this.pin, token: player.token, id: player.id, name: player.name });
    this.sendPlayerSnapshot(player);
    this.sendLobby();
    return player;
  }

  resume(conn: Conn, token: string): Player | null {
    if (this.banned.has(token)) {
      conn.send({ t: "kicked" });
      return null;
    }
    const player = this.players.get(token);
    if (!player) return null;
    if (player.conn && player.conn !== conn) player.conn.close();
    player.conn = conn;
    this.touch();
    conn.send({ t: "player:joined", pin: this.pin, token: player.token, id: player.id, name: player.name });
    this.sendPlayerSnapshot(player);
    this.sendLobby();
    return player;
  }

  answer(player: Player, q: unknown, choice: unknown) {
    if (this.phase !== "open" || q !== this.qIndex) return;
    if (!Number.isInteger(choice) || (choice as number) < 0 || (choice as number) >= this.question.choices.length) return;
    if (player.answers[this.qIndex]) return; // first answer counts
    const ms = Math.min(this.now() - this.openedAt, this.question.timeMs);
    const correct = this.question.correct.includes(choice as number);
    player.answers[this.qIndex] = { choice: choice as number, ms, correct, points: 0 };
    player.conn?.send({ t: "p:ack", q: this.qIndex });
    this.touch();
    this.scheduleProgress();
    this.maybeCloseEarly();
  }

  // ---------- phases ----------

  private beginQuestion(i: number) {
    this.clearTimer();
    this.qIndex = i;
    this.phase = "intro";
    const q = this.question;
    this.phaseEndsAt = this.now() + config.introMs;
    this.hostView = { t: "intro", q: i, total: this.total, text: q.text, image: q.image, type: q.type, timeMs: q.timeMs, points: q.points, introMs: config.introMs };
    this.host?.send(this.hostView);
    for (const p of this.players.values()) this.sendPlayerSnapshot(p);
    this.timer = setTimeout(() => this.openQuestion(), config.introMs);
  }

  private openQuestion() {
    this.clearTimer();
    this.phase = "open";
    const q = this.question;
    this.openedAt = this.now();
    this.phaseEndsAt = this.openedAt + q.timeMs;
    this.hostView = { t: "open", q: this.qIndex, total: this.total, text: q.text, image: q.image, choices: q.choices, remainingMs: q.timeMs, timeMs: q.timeMs };
    this.host?.send(this.hostView);
    this.host?.send({ t: "progress", answered: 0, total: this.players.size });
    for (const p of this.players.values()) this.sendPlayerSnapshot(p);
    this.timer = setTimeout(() => this.closeQuestion(), q.timeMs + ANSWER_GRACE_MS);
  }

  private maybeCloseEarly() {
    if (this.phase !== "open") return;
    let connected = 0;
    let waiting = 0;
    for (const p of this.players.values()) {
      if (!p.conn) continue;
      connected++;
      if (!p.answers[this.qIndex]) waiting++;
    }
    if (connected > 0 && waiting === 0) this.closeQuestion();
  }

  private closeQuestion() {
    if (this.phase !== "open") return;
    this.clearTimer();
    this.phase = "reveal";
    const q = this.question;
    const base = basePoints(q.points);
    const dist = new Array(q.choices.length).fill(0);

    for (const p of this.players.values()) {
      const a = p.answers[this.qIndex];
      p.lastDelta = 0;
      if (a) dist[a.choice]++;
      if (base === 0) continue; // no-points questions don't touch scores or streaks
      if (a?.correct) {
        p.streak++;
        a.points = questionPoints(true, a.ms, q.timeMs, base) + streakBonus(p.streak);
        p.score += a.points;
        p.lastDelta = a.points;
        p.totalCorrectMs += a.ms;
      } else {
        p.streak = 0;
      }
    }

    const ranked = this.ranked();
    ranked.forEach((p, i) => {
      const a = p.answers[this.qIndex];
      const above = i > 0 ? ranked[i - 1] : null;
      p.lastResult = {
        t: "p:result",
        q: this.qIndex,
        total: this.total,
        answered: !!a,
        correct: !!a?.correct,
        points: p.lastDelta,
        streak: p.streak,
        score: p.score,
        rank: i + 1,
        count: ranked.length,
        behind: above ? { name: above.name, gap: above.score - p.score } : null,
      };
      p.conn?.send(p.lastResult);
    });

    this.hostView = { t: "reveal", q: this.qIndex, total: this.total, text: q.text, image: q.image, choices: q.choices, correct: q.correct, dist };
    this.host?.send(this.hostView);
    this.autoplay();
  }

  private showScoreboard() {
    this.clearTimer();
    this.phase = "scoreboard";
    this.hostView = { t: "scoreboard", q: this.qIndex, total: this.total, top: this.standings(5) };
    this.host?.send(this.hostView);
    this.autoplay();
  }

  private podium() {
    this.clearTimer();
    this.phase = "podium";
    this.saveResults();
    this.hostView = { t: "podium", top: this.standings(5), count: this.players.size, resultsFile: this.resultsFile };
    this.host?.send(this.hostView);
    for (const p of this.players.values()) this.sendPlayerSnapshot(p);
  }

  private autoplay() {
    if (!this.settings.autoplay) return;
    this.timer = setTimeout(() => {
      // Without a projector connected nobody can see the game, so wait for the host.
      if (this.host) this.next();
    }, AUTOPLAY_MS);
  }

  // ---------- views ----------

  ranked() {
    return [...this.players.values()].sort(compareStanding);
  }

  standings(limit: number): Standing[] {
    return this.ranked()
      .slice(0, limit)
      .map((p, i) => ({ id: p.id, name: p.name, score: p.score, delta: p.lastDelta, streak: p.streak, rank: i + 1 }));
  }

  playerList(): PlayerInfo[] {
    return [...this.players.values()].map((p) => ({ id: p.id, name: p.name, connected: !!p.conn }));
  }

  private sendLobby() {
    // The projector only shows the name cloud in the lobby; mid-game the
    // list is only used for the answered/total counter.
    if (this.phase === "lobby") this.host?.send({ t: "lobby", players: this.playerList(), locked: this.locked });
    else if (this.phase === "open") this.scheduleProgress();
  }

  private scheduleProgress() {
    if (this.progressTimer) return;
    this.progressTimer = setTimeout(() => {
      this.progressTimer = null;
      if (this.phase !== "open") return;
      let answered = 0;
      for (const p of this.players.values()) if (p.answers[this.qIndex]) answered++;
      this.host?.send({ t: "progress", answered, total: this.players.size });
    }, PROGRESS_THROTTLE_MS);
  }

  private remaining() {
    return Math.max(0, Math.round(this.phaseEndsAt - this.now()));
  }

  private sendHostSnapshot() {
    const h = this.host;
    if (!h) return;
    h.send({ t: "host:created", pin: this.pin, hostToken: this.hostToken, title: this.quiz.title, count: this.total, settings: this.settings, images: this.images() });
    if (this.phase === "lobby") {
      h.send({ t: "lobby", players: this.playerList(), locked: this.locked });
    } else if (this.hostView?.t === "intro") {
      h.send({ ...this.hostView, introMs: this.remaining() });
    } else if (this.hostView?.t === "open") {
      h.send({ ...this.hostView, remainingMs: this.remaining() });
      this.scheduleProgress();
    } else if (this.hostView) {
      h.send(this.hostView);
    }
  }

  private sendPlayerSnapshot(p: Player) {
    const c = p.conn;
    if (!c) return;
    const q = this.question;
    switch (this.phase) {
      case "lobby":
        c.send({ t: "p:lobby", name: p.name });
        break;
      case "intro":
        c.send({ t: "p:intro", q: this.qIndex, total: this.total, nChoices: q.choices.length, type: q.type, introMs: this.remaining() });
        break;
      case "open":
        c.send({ t: "p:open", q: this.qIndex, total: this.total, nChoices: q.choices.length, type: q.type, remainingMs: this.remaining(), timeMs: q.timeMs });
        if (p.answers[this.qIndex]) c.send({ t: "p:ack", q: this.qIndex });
        break;
      case "reveal":
      case "scoreboard":
        if (p.lastResult) c.send(p.lastResult);
        else c.send({ t: "p:lobby", name: p.name }); // joined late, between questions
        break;
      case "podium": {
        const ranked = this.ranked();
        c.send({ t: "p:final", rank: ranked.indexOf(p) + 1, score: p.score, count: ranked.length });
        break;
      }
      case "ended":
        c.send({ t: "p:ended" });
        break;
    }
  }

  private images() {
    return [...new Set(this.quiz.questions.map((q) => q.image).filter((x): x is string => !!x))];
  }

  // ---------- misc ----------

  private saveResults() {
    if (this.resultsFile) return;
    const players: ResultsPlayer[] = this.ranked().map((p, i) => {
      const correct = p.answers.filter((a): a is Answer => !!a?.correct);
      return {
        rank: i + 1,
        name: p.name,
        score: p.score,
        correctCount: correct.length,
        avgCorrectMs: correct.length ? correct.reduce((s, a) => s + a.ms, 0) / correct.length : null,
        answers: p.answers.map((a) => (a ? { ...a, ms: Math.round(a.ms) } : null)),
      };
    });
    this.resultsFile = writeResults({
      pin: this.pin,
      quizId: this.quiz.id,
      title: this.quiz.title,
      startedAt: new Date(this.startedAt ?? this.createdAt).toISOString(),
      finishedAt: new Date().toISOString(),
      questions: this.quiz.questions.map((q) => ({ text: q.text, choices: q.choices, correct: q.correct })),
      players,
    });
  }

  private clearTimer() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
  }

  private touch() {
    this.lastActivity = Date.now();
  }
}
