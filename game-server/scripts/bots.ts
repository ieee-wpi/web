// Load test: one bot host + N bot players play a full game over real WebSockets.
//
//   npm run quiz:build
//   npm run quiz:bots -- --url ws://localhost:9001 --password test --n 150
//   npm run quiz:bots -- --url wss://ieee-dev.wpi.edu/quiz-ws/ --password ... --n 150 --drop 0.1
//
// Or join an existing game (a human hosts on the projector): --pin 123456
import { WebSocket } from "ws";
import type { ClientMessage, ServerMessage } from "../protocol";

function arg(name: string, fallback: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

const URL_ = arg("url", "ws://localhost:9001");
const N = Number(arg("n", "50"));
const DROP = Number(arg("drop", "0.05")); // chance per question that a bot disconnects and resumes
const PASSWORD = arg("password", process.env.QUIZ_HOST_PASSWORD ?? "test");
const QUIZ = arg("quiz", "local:Sample_Quiz");
const ORIGIN = arg("origin", "http://localhost:3000");
const EXISTING_PIN = arg("pin", "");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const stats = { joined: 0, answers: 0, acks: 0, results: 0, resumes: 0, errors: 0, finals: 0 };

function open(): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(URL_, { origin: ORIGIN });
    ws.once("open", () => resolve(ws));
    ws.once("error", reject);
  });
}
const send = (ws: WebSocket, m: ClientMessage) => ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify(m));

async function host(): Promise<{ pin: string; done: Promise<void> }> {
  const ws = await open();
  let resolvePin!: (pin: string) => void;
  const pinP = new Promise<string>((r) => (resolvePin = r));
  let resolveDone!: () => void;
  const done = new Promise<void>((r) => (resolveDone = r));
  let started = false;

  ws.on("message", (raw) => {
    const m = JSON.parse(raw.toString()) as ServerMessage;
    if (m.t === "host:created") resolvePin(m.pin);
    else if (m.t === "lobby" && !started && m.players.length >= N) {
      started = true;
      console.log(`[host] ${m.players.length} players in lobby, starting`);
      send(ws, { t: "host:start" });
    } else if (m.t === "reveal") {
      console.log(`[host] Q${m.q + 1}/${m.total} dist=${JSON.stringify(m.dist)}`);
      setTimeout(() => send(ws, { t: "host:next" }), 500);
    } else if (m.t === "scoreboard") {
      console.log(`[host] top: ${m.top.map((s) => `${s.name}=${s.score}`).join(", ")}`);
      setTimeout(() => send(ws, { t: "host:next" }), 500);
    } else if (m.t === "podium") {
      console.log(`[host] podium: ${m.top.slice(0, 3).map((s) => `${s.rank}. ${s.name} ${s.score}`).join(" | ")} (${m.resultsFile})`);
      setTimeout(() => {
        send(ws, { t: "host:end" });
        ws.close();
        resolveDone();
      }, 500);
    } else if (m.t === "error") {
      console.error(`[host] error ${m.code}: ${m.message}`);
      process.exit(1);
    }
  });
  send(ws, { t: "host:create", password: PASSWORD, quizId: QUIZ, settings: { nameGenerator: false, autoplay: false } });
  return { pin: await pinP, done };
}

async function player(pin: string, i: number) {
  let token = "";
  let finished = false;

  const connect = async (resume: boolean) => {
    const ws = await open();
    ws.on("message", (raw) => {
      const m = JSON.parse(raw.toString()) as ServerMessage;
      switch (m.t) {
        case "player:joined":
          if (!token) stats.joined++;
          token = m.token;
          break;
        case "p:open": {
          const delay = 300 + Math.random() * Math.min(8000, m.remainingMs - 500);
          const choice = Math.floor(Math.random() * m.nChoices);
          setTimeout(() => {
            if (Math.random() < DROP) {
              // Simulate a phone locking mid-question, then coming back.
              ws.terminate();
              setTimeout(() => connect(true).catch(() => stats.errors++), 500 + Math.random() * 1500);
              return;
            }
            stats.answers++;
            send(ws, { t: "player:answer", q: m.q, choice });
          }, Math.max(0, delay));
          break;
        }
        case "p:ack":
          stats.acks++;
          break;
        case "p:result":
          stats.results++;
          break;
        case "p:final":
          stats.finals++;
          finished = true;
          break;
        case "p:ended":
          ws.close();
          break;
        case "error":
          stats.errors++;
          console.error(`[bot ${i}] ${m.code}: ${m.message}`);
          break;
      }
    });
    if (resume) {
      stats.resumes++;
      send(ws, { t: "player:resume", pin, token });
    } else {
      send(ws, { t: "player:join", pin, name: `Bot ${i}` });
    }
  };
  await connect(false);
  return () => finished;
}

async function main() {
  const t0 = Date.now();
  const h = EXISTING_PIN ? null : await host();
  const pin = EXISTING_PIN || h!.pin;
  console.log(`[bots] joining game ${pin} with ${N} bots at ${URL_}`);
  for (let i = 0; i < N; i++) {
    player(pin, i + 1).catch((e) => {
      stats.errors++;
      console.error(`[bot ${i + 1}] connect failed: ${(e as Error).message}`);
    });
    await sleep(20); // ~50 joins/s, a realistic QR-code burst
  }
  if (h) await h.done;
  else await sleep(10 * 60_000);
  await sleep(300);
  console.log(`[bots] done in ${((Date.now() - t0) / 1000).toFixed(1)}s`, stats);
  process.exit(stats.errors ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
