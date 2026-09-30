import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import { WebSocket, WebSocketServer } from "ws";
import { checkPassword, safeEqual } from "./auth";
import { builderBadPasswordLimiter, builderLimiter, handleBuilder } from "./builder-http";
import { config } from "./config";
import { Game, randomToken, type Conn, type Player } from "./game";
import type { ClientMessage, ErrorCode, ServerMessage } from "./protocol";
import { isGeneratedName } from "./names";
import { listQuizzes, loadQuiz } from "./quiz-source";
import { KeyedLimiter, TokenBucket } from "./rate-limit";
import { listResults, resultsPath } from "./results";

const HEARTBEAT_MS = 25_000;
const SWEEP_MS = 60_000;
const ENDED_TTL_MS = 30 * 60_000;
const IDLE_TTL_MS = 2 * 60 * 60_000;
const MAX_PAYLOAD = 1024;

const games = new Map<string, Game>();

// Limits are per client IP. Campus Wi-Fi puts many students behind one
// address, so the join limit is deliberately loose.
const joinLimiter = new KeyedLimiter(300, 5);
const badPinLimiter = new KeyedLimiter(20, 20 / 60);
const passwordLimiter = new KeyedLimiter(10, 10 / 60);

// ---------- helpers ----------

function newPin() {
  for (;;) {
    const pin = String(crypto.randomInt(100_000, 1_000_000));
    if (!games.has(pin)) return pin;
  }
}

function clientIp(req: http.IncomingMessage) {
  const remote = req.socket.remoteAddress ?? "";
  // Only trust X-Forwarded-For when the request came through the local Apache proxy.
  if (remote === "127.0.0.1" || remote === "::1" || remote === "::ffff:127.0.0.1") {
    const fwd = String(req.headers["x-forwarded-for"] ?? "").split(",")[0].trim();
    if (fwd) return fwd;
  }
  return remote;
}

// ---------- HTTP (health, results download, quiz builder) ----------

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://localhost");
  // In production the site and this server share an origin through Apache;
  // in dev the page is on :3000 and needs CORS for results and the builder.
  const origin = req.headers.origin;
  if (origin && config.allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
      "Access-Control-Max-Age": "600",
    });
    return res.end();
  }
  const send = (status: number, body: string, type = "text/plain; charset=utf-8") => {
    res.writeHead(status, { "Content-Type": type, "Cache-Control": "no-store" });
    res.end(body);
  };

  if (url.pathname === "/health") {
    const players = [...games.values()].reduce((n, g) => n + g.playerCount, 0);
    const rssMb = Math.round(process.memoryUsage().rss / 1e6);
    return send(200, JSON.stringify({ ok: true, games: games.size, players, rssMb }), "application/json");
  }

  if (url.pathname === "/quizzes" || url.pathname.startsWith("/quizzes/")) {
    void handleBuilder(req, res, url, clientIp(req));
    return;
  }

  if (url.pathname === "/results" || url.pathname.startsWith("/results/")) {
    const ip = clientIp(req);
    const key = url.searchParams.get("key") ?? "";
    const file = decodeURIComponent(url.pathname.slice("/results/".length));
    // A live game's host token may download that game's own results file.
    const hostOk = [...games.values()].some((g) => file.endsWith(`_${g.pin}.csv`) && safeEqual(key, g.hostToken));
    if (!hostOk) {
      if (!passwordLimiter.take(ip)) return send(429, "Too many attempts");
      if (!checkPassword(key)) return send(403, "Forbidden");
    }
    if (url.pathname === "/quizzes" || url.pathname.startsWith("/quizzes/")) {
    void handleBuilder(req, res, url, clientIp(req));
    return;
  }

  if (url.pathname === "/results" || url.pathname === "/results/") {
      return send(200, JSON.stringify(listResults()), "application/json");
    }
    const p = resultsPath(file);
    if (!p) return send(404, "Not found");
    res.writeHead(200, {
      "Content-Type": file.endsWith(".csv") ? "text/csv; charset=utf-8" : "application/json",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
    });
    fs.createReadStream(p).pipe(res);
    return;
  }

  send(404, "Not found");
});

// ---------- WebSocket ----------

type Client = {
  ws: WebSocket;
  conn: Conn;
  ip: string;
  alive: boolean;
  bucket: TokenBucket;
  game: Game | null;
  role: "none" | "host" | "player";
  player: Player | null;
};

const wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD });
const clients = new Set<Client>();

server.on("upgrade", (req, socket, head) => {
  const origin = req.headers.origin;
  if (origin && !config.allowedOrigins.includes(origin)) {
    socket.write("HTTP/1.1 403 Forbidden\r\n\r\n");
    socket.destroy();
    return;
  }
  wss.handleUpgrade(req, socket, head, (ws) => onConnection(ws, req));
});

function onConnection(ws: WebSocket, req: http.IncomingMessage) {
  const conn: Conn = {
    send(msg: ServerMessage) {
      if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
    },
    close() {
      ws.close();
    },
  };
  const client: Client = { ws, conn, ip: clientIp(req), alive: true, bucket: new TokenBucket(10, 5), game: null, role: "none", player: null };
  clients.add(client);

  ws.on("pong", () => (client.alive = true));
  ws.on("message", (data, isBinary) => {
    client.alive = true;
    if (isBinary) return ws.close(1003);
    if (!client.bucket.take()) {
      conn.send({ t: "error", code: "RATE", message: "Slow down." });
      return ws.close(1008);
    }
    let msg: ClientMessage;
    try {
      msg = JSON.parse(data.toString());
    } catch {
      return ws.close(1007);
    }
    if (!msg || typeof msg !== "object" || typeof msg.t !== "string") return ws.close(1007);
    handle(client, msg).catch((err) => {
      console.error("[quiz] handler error:", err);
      conn.send({ t: "error", code: "BAD_REQUEST", message: "Something went wrong." });
    });
  });
  ws.on("close", () => {
    clients.delete(client);
    client.game?.detach(conn);
  });
  ws.on("error", () => ws.terminate());
}

function fail(client: Client, code: ErrorCode, message: string) {
  client.conn.send({ t: "error", code, message });
}

function findGame(client: Client, pin: unknown): Game | null {
  const game = typeof pin === "string" ? games.get(pin) : undefined;
  if (game && game.phase !== "ended") return game;
  if (!badPinLimiter.take(client.ip)) {
    fail(client, "RATE", "Too many attempts. Wait a minute and try again.");
    client.ws.close(1008);
    return null;
  }
  fail(client, "BAD_PIN", "No game with that PIN.");
  return null;
}

async function handle(client: Client, msg: ClientMessage) {
  const { conn } = client;

  // ----- host messages that need the password -----
  if (msg.t === "host:listQuizzes" || msg.t === "host:validate" || msg.t === "host:create") {
    if (!passwordLimiter.take(client.ip)) return fail(client, "RATE", "Too many attempts. Wait a minute.");
    if (!checkPassword(msg.password)) return fail(client, "BAD_PASSWORD", "Wrong host password.");

    if (msg.t === "host:listQuizzes") {
      return conn.send({ t: "host:quizzes", quizzes: await listQuizzes() });
    }

    let loaded;
    try {
      loaded = await loadQuiz(String(msg.quizId));
    } catch (err) {
      return fail(client, "QUIZ_UNAVAILABLE", (err as Error).message);
    }
    const { quiz, problems } = loaded;

    if (msg.t === "host:validate") {
      return conn.send({ t: "host:validated", quizId: quiz.id, title: quiz.title, count: quiz.questions.length, problems });
    }

    if (problems.length > 0) return fail(client, "QUIZ_INVALID", `Quiz has ${problems.length} problem(s); fix them in the sheet first.`);
    const live = [...games.values()].filter((g) => g.phase !== "ended").length;
    if (live >= config.maxGames) return fail(client, "TOO_MANY_GAMES", "Too many games are running right now.");

    const settings = { nameGenerator: !!msg.settings?.nameGenerator, autoplay: !!msg.settings?.autoplay };
    const game = new Game(newPin(), randomToken(), quiz, settings);
    games.set(game.pin, game);
    client.game?.detach(conn);
    client.game = game;
    client.role = "host";
    game.attachHost(conn);
    console.log(`[quiz] game ${game.pin} created: "${quiz.title}" (${quiz.questions.length} questions)`);
    return;
  }

  if (msg.t === "host:resume") {
    const game = typeof msg.pin === "string" ? games.get(msg.pin) : undefined;
    if (!game || typeof msg.hostToken !== "string" || !safeEqual(msg.hostToken, game.hostToken)) {
      if (!badPinLimiter.take(client.ip)) client.ws.close(1008);
      return fail(client, "BAD_TOKEN", "That game is no longer available.");
    }
    client.game = game;
    client.role = "host";
    game.attachHost(conn);
    return;
  }

  // ----- host controls (already authenticated by this socket) -----
  if (msg.t.startsWith("host:")) {
    const game = client.game;
    if (client.role !== "host" || !game || game.host !== conn) return fail(client, "BAD_TOKEN", "Not the host of a game.");
    switch (msg.t) {
      case "host:start":
        return game.start();
      case "host:next":
        return game.next();
      case "host:skip":
        return game.skip();
      case "host:kick":
        return game.kick(String(msg.playerId));
      case "host:lock":
        return game.setLocked(!!msg.locked);
      case "host:end":
        return game.end();
    }
    return;
  }

  // ----- players -----
  switch (msg.t) {
    case "player:checkPin": {
      const game = findGame(client, msg.pin);
      if (!game) return;
      const blocked = game.canJoin();
      if (blocked) return fail(client, blocked, blocked === "LOCKED" ? "This game is locked." : blocked === "FULL" ? "This game is full." : "That game has ended.");
      conn.send({ t: "player:pinOk", pin: game.pin, nameGenerator: game.settings.nameGenerator, suggestion: game.suggestName() });
      return;
    }
    case "player:join": {
      if (!joinLimiter.take(client.ip)) return fail(client, "RATE", "Too many joins from this network. Try again shortly.");
      const game = findGame(client, msg.pin);
      if (!game) return;
      if (client.player) return; // one player per socket
      // In generator mode only generated names are accepted, so a player can't type their own.
      const name = game.settings.nameGenerator && !isGeneratedName(msg.name) ? game.suggestName() : msg.name;
      const result = game.join(conn, name);
      if ("error" in result) return fail(client, result.error, result.message);
      client.game = game;
      client.role = "player";
      client.player = result;
      return;
    }
    case "player:resume": {
      const game = typeof msg.pin === "string" ? games.get(msg.pin) : undefined;
      const player = game && typeof msg.token === "string" ? game.resume(conn, msg.token) : null;
      if (!game || !player) {
        if (!badPinLimiter.take(client.ip)) client.ws.close(1008);
        return fail(client, "BAD_TOKEN", "That game is no longer available.");
      }
      client.game = game;
      client.role = "player";
      client.player = player;
      return;
    }
    case "player:answer": {
      if (client.role === "player" && client.game && client.player) client.game.answer(client.player, msg.q, msg.choice);
      return;
    }
  }
  fail(client, "BAD_REQUEST", "Unknown message.");
}

// ---------- housekeeping ----------

setInterval(() => {
  for (const c of clients) {
    if (!c.alive) {
      c.ws.terminate();
      continue;
    }
    c.alive = false;
    c.ws.ping();
  }
}, HEARTBEAT_MS);

setInterval(() => {
  const now = Date.now();
  for (const [pin, g] of games) {
    const expired = (g.endedAt !== null && now - g.endedAt > ENDED_TTL_MS) || now - g.lastActivity > IDLE_TTL_MS;
    if (expired) {
      g.end();
      g.dispose();
      games.delete(pin);
      console.log(`[quiz] game ${pin} removed`);
    }
  }
  joinLimiter.sweep();
  badPinLimiter.sweep();
  passwordLimiter.sweep();
  builderLimiter.sweep();
  builderBadPasswordLimiter.sweep();
}, SWEEP_MS);

server.listen(config.port, () => {
  console.log(`[quiz] game server listening on :${config.port}`);
});

for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    for (const g of games.values()) g.end(); // saves results for in-progress games
    process.exit(0);
  });
}
