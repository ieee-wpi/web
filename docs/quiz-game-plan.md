# Live Quiz Game ("Kahoot-style") — Implementation Plan

Written 2026-09-29 against branch `nextjs-migration` (Next 16.3.7, React 18).

## Implementation status (2026-09-29)

**Done:** milestones 1–9 and 12, plus the deploy config for milestone 10. Verified locally:
- 17 unit tests pass.
- Bot load test: 200 players with 10% simulated disconnects, 0 errors, peak RSS **57 MB**.
- A full game played in a real browser: join, answer, phone refresh and host refresh mid-game (both resumed), podium, CSV download.

**Left:** milestone 10 on the VM (needs sudo for Apache; see `docs/quiz-runbook.md`), the milestone 11 dry run on real phones and campus Wi-Fi, creating the quiz spreadsheet, and optional CC0 music files.

Deviations from the plan below:
- **Node:** the VM had Node 18, which is too old even for Next 16 itself, so it was upgraded to 22 via nvm. The game server is **compiled with `tsc` to `game-server/dist/`** rather than relying on native TS type stripping.
- **Protocol file location:** `protocol.ts` lives in `game-server/` (the server owns it), not `src/lib/quiz/`. The front end imports it with `import type`.
- **PIN step:** the join flow has a `player:checkPin` → `player:pinOk` step. It validates the PIN before asking for a name, and tells the phone whether nickname-generator mode is on.
- **Local quizzes:** CSVs in `game-server/quizzes/` appear alongside Sheet quizzes. This is useful for dev and as a fallback if Google is down.
- **Join rate limit:** 300 burst at 5/s per IP (the plan said 60/min), because a whole room can share one campus NAT address.
- **Sound:** effects are synthesized with Web Audio (no assets or licensing). Only the two music loops are optional files.
- **Scoreboard animation:** rows use a staggered slide-in rather than a FLIP reorder animation.
- **Bundle size:** the `/quiz` page adds about 11 KB gzipped to the ~180 KB React/Next baseline every page already ships. The plan's "< 60 KB total" target wasn't realistic given that baseline.
- **Results URL:** results files are named `YYYY-MM-DD_HHMM_PIN.{csv,json}`, so the same PIN on the same day can't collide.

Decisions already made (from the officer asking for this):

| Question | Decision |
|---|---|
| Scale | 50–150 simultaneous players per game |
| Where realtime runs | **Our VM only** — no third-party realtime service |
| Quiz authoring | **Google Sheet**, same pattern as Wordle (edit sheet, no redeploy) |
| v1 features | Multiple choice + True/False, images on questions, sound/music, persistent results, standings between questions and at the end |

---

## 1. What Kahoot actually is (the parts we're copying)

Research summary; sources are in the appendix.

### 1.1 Game flow

1. **Host** picks a quiz and launches it. The server issues a numeric **game PIN** that exists only for that session.
2. **Lobby.** Players go to a join page on their phones, enter the PIN and a nickname, and their name pops up on the **shared screen** (projector). The host can kick names and lock the lobby.
3. **Per question:**
   1. *Intro* — the question text (and image) shows on the shared screen for a few seconds with a "get ready" jingle; phones show "Get ready…".
   2. *Open* — four colored answer tiles appear on the shared screen with a timer and music. **Phones show only the four colored shapes, no text.** This forces everyone to look at the projector and is the core of the game-show feel.
   3. The question closes when the timer runs out **or everyone has answered**.
   4. *Reveal* — the correct answer is highlighted, with a bar chart of how many people picked each option. Each phone flashes green or red with "+N points" and the player's streak.
   5. *Scoreboard* — top 5 by cumulative score. Each phone shows the player's rank and how far behind the next person they are.
4. **Podium.** The top 3 are revealed one at a time with a fanfare, and every phone shows its final rank.
5. **Report.** The host can export the results (Kahoot exports to Excel/CSV).

Shape and color mapping (keep it; people recognize it): **red triangle, blue diamond, yellow circle, green square**.

### 1.2 Scoring (documented by Kahoot)

```
points = round( (1 - (responseTime / timeLimit) / 2) * base )     // correct answers only
base   = 1000 (standard) | 2000 (double points) | 0 (no points)
```

- An instant correct answer scores about 1000; one at the buzzer scores 500; a wrong or missing answer scores 0.
- **Answer streak bonus:** +100 per consecutive correct answer, capped at +500. A wrong answer resets it. (Players love the visible streak counter.)
- Kahoot's quiz type may mark *several* options correct; picking **any** of them scores. (That's different from multi-select, which is paid and out of scope.)
- Kahoot's tie-break rule isn't documented, so we define our own (§5.4).

### 1.3 Things Kahoot gets right that are cheap to copy

- The shape-only phone UI. It's less for phones to render and download, and it's the thing people recognize.
- Suspense: the distribution chart comes **before** the scores, and the podium reveals 3rd, then 2nd, then 1st.
- Reconnect keeps your score. Kahoot resumes a *dropped socket* with the score intact, but a full **refresh** creates a new player at 0 points. That's a known Kahoot annoyance, and **we fix it with a session token** (§5.6).
- A nickname generator (adjective + animal) is the simplest anti-abuse tool there is.

### 1.4 Things we deliberately drop

Team mode, self-paced/"challenge" mode, ghost mode, paid question types (slider, puzzle, type-answer, multi-select, poll, word cloud), in-app quiz editor, and accounts. All of these can be added later without changing the architecture.

---

## 2. Constraints that shape everything

- **Small shared VM.** Assume ~1 vCPU and 1–2 GB RAM, also serving the site. Apache terminates TLS and proxies `/` to `next start` on :9000.
- **`deploy.sh` runs `tmux kill-server`.** Any redeploy of the site currently kills **every** tmux session. A game server in tmux would die mid-event.
- **No test suite, no linter.** `npm run typecheck` is the only check.
- **Campus Wi-Fi and phones.** Expect access-point roaming, locked screens, backgrounded tabs, and people refreshing. Some players *will* disconnect during a 20-minute game.
- **Few games per semester.** Idle cost matters more than peak throughput.

### 2.1 How much compute does this actually need?

| Item | Estimate for one 150-player game |
|---|---|
| Game state (players, scores, answers) | < 1 MB |
| WebSocket connections (`ws`, ~50–90 KB each) | ~8–14 MB |
| Node game-server process baseline | ~40–50 MB RSS |
| CPU per question | ~5 broadcasts × 150 sends, plus one sort of 150 — **sub-millisecond** |
| Network per question | ~150 × ~5 messages × ~200 B ≈ **150 KB** total |
| Question images | Loaded **only by the projector browser**, never by phones |
| Peak load | The **join burst**: 150 phones fetch the `/quiz` page within about a minute. It's a static page, so Next serves it from cache. |

**Conclusion:** the live game is not the bottleneck; 150 sockets is tiny. The real compute risks are (a) the join-burst page load, handled by keeping `/quiz` static and light, and (b) accidentally routing images or per-second timer ticks through the VM. The design below avoids both.

---

## 3. Architecture decision

### 3.1 Options considered

| Option | VM cost | Complexity | Reliability | Verdict |
|---|---|---|---|---|
| **A. Separate tiny Node + `ws` process on :9001, server-authoritative, in-memory** | ~50 MB idle, ~0 CPU | Medium | High; survives site redeploys | **Chosen** |
| B. Next custom server (`server.js` + `ws` on `upgrade`) | Same | Medium | Lower: every site deploy kills live games, and it blocks `output: 'standalone'` | Rejected |
| C. `next-ws` (patches Next internals so route handlers accept `SOCKET`) | Same | Low at first, fragile on every Next upgrade | Medium | Rejected |
| D. SSE from a Next route handler + POST answers | Same | Medium: response buffering gotchas, `flushpackets=on` in Apache, and module-level state isn't reliably shared across route bundles | Medium | Rejected |
| E. Host-browser-authoritative (the projector tab runs the game, the server is a dumb relay) | Lowest | Medium | **Low**: projector tab refresh or sleep = game over; the answer key lives in a browser | Rejected |
| F. Firebase / Pusher free tier | 0 | Low | **Hard cap of 100 connections**, below target | Out (and user chose VM-only) |
| G. Supabase Realtime / Ably / Cloudflare DO | 0 | Medium | OK (200+ connection caps) | Out: user chose VM-only. **Fallback if the VM ever can't cope.** |
| H. WebRTC / PeerJS mesh from the host tab | 0 | High | Poor on campus NAT; 150 peer connections in one tab | Rejected |

### 3.2 Chosen design

```
 phones (150)                projector laptop (host)
     │  wss://ieee.wpi.edu/quiz-ws   │
     └──────────────┬────────────────┘
                    ▼
      Apache :443  (TLS, ProxyPass /quiz-ws → :9001 upgrade=websocket)
          │                                  │
          ▼                                  ▼
  next start :9000                   game-server :9001   (plain Node + ws)
  serves /quiz, /quiz/host           • all game state in memory (Map<pin, Game>)
  (static pages + JS)                • authoritative timers, scoring, answer key
                                     • fetches quiz CSV from Google Sheets
                                     • writes results to disk (JSON + CSV)
```

Key properties:

- **Server-authoritative.** Only the server knows the answer key before the reveal, measures answer time, and computes scores. Phones can't cheat by inspecting JS, and a projector refresh doesn't lose the game.
- **Independent lifecycle.** The site can be redeployed mid-event without touching the game (after the `deploy.sh` change in §9.3).
- **No per-second messages.** Timers are sent once as a *duration* and counted down locally on each device. There's no broadcast per tick.
- **Phones never get question text or images.** They get only "question N of M, 4 choices, X ms remaining". Payloads stay tiny, and phones can't read the answers ahead of the projector.
- **No database.** Live state is in memory; finished results are append-only JSON/CSV files. A crash mid-game loses that game, which is acceptable at this scale and documented in the runbook.

---

## 4. Repository layout

```
game-server/                         NEW — standalone Node process, no framework
  index.ts                           http server (health + results download) + ws server, routing, heartbeat
  game.ts                            Game class: state machine, players, timers
  scoring.ts                         pure functions: points, streak, ranking, tie-break
  quiz-source.ts                     fetch published Sheet CSV, parse, validate → Quiz
  csv.ts                             ~40-line RFC 4180 parser (quoted commas/newlines)
  names.ts                           nickname normalize/validate/profanity + generator word lists
  results.ts                         write results/<date>_<pin>.{json,csv}; list past results
  rate-limit.ts                      token bucket per socket / per IP
  config.ts                          env parsing with defaults
  scripts/bots.ts                    load test: N fake players over ws
  *.test.ts                          node:test unit tests (scoring, csv, quiz validation)
  tsconfig.json                      Node-flavored tsconfig (module nodenext)
  results/                           gitignored output directory

src/lib/quiz/
  protocol.ts                        SHARED message types (type-only; imported by both sides)
  shapes.ts                          color/shape table (red triangle, blue diamond, …)
  use-quiz-socket.ts                 "use client" hook: connect, reconnect w/ backoff, resume token

src/app/quiz/                        (outside the site chrome — see §6.1)
  layout.tsx                         bare full-screen layout (no Navbar/Footer)
  page.tsx                           player: server wrapper exporting metadata
  host/page.tsx                      host: server wrapper, noindex

src/components/quiz/
  player.tsx          "use client"   player state machine UI
  host.tsx            "use client"   host state machine UI
  answer-tiles.tsx                   4 tiles (phone: shapes only; host: shape + text)
  shape-icon.tsx                     inline SVG triangle/diamond/circle/square
  countdown.tsx                      local countdown ring from a duration
  distribution-chart.tsx             4 bars, CSS only (no chart lib)
  scoreboard.tsx                     top-5 with animated reordering (CSS transforms)
  podium.tsx                         3rd → 2nd → 1st reveal
  lobby.tsx                          PIN + join URL + QR + name cloud with kick
  sound.ts                           tiny audio manager (preload, unlock, mute, fade)

public/quiz/
  sfx/lobby.mp3, sfx/question.mp3, sfx/countdown.mp3, sfx/reveal.mp3, sfx/podium.mp3   (CC0 only)
  img/                               optional home for question images (see §7.3)
```

### 4.1 Dependencies

| Package | Where | Why | Size concern |
|---|---|---|---|
| `ws` | game-server | WebSocket server. The standard, and lean enough for 150 connections. | none |
| `obscenity` | game-server | Nickname profanity filter; much better against leetspeak and lookalikes than `bad-words` | server only |
| `qrcode` (or a hand-rolled SVG QR) | host page only | Join QR code on the projector | host bundle only, lazy-loaded |

Deliberately **not** using: Socket.IO (its rooms and reconnect are nice, but we need custom resume semantics anyway, and it adds client bundle weight to every phone), uWebSockets.js (native binding, overkill at 150), `papaparse` (our CSV is small and a 40-line parser is enough), and chart libraries.

### 4.2 Running TypeScript on the server without a build step

Node ≥ 22.18 / 23.6 runs `.ts` files natively (type stripping); locally it's Node 24. The game server is plain TS with **no enums, no namespaces, no parameter properties** (the constraints of erasable syntax). Run it with `node game-server/index.ts`. If the VM's Node is older, fall back to `npx tsx game-server/index.ts` or upgrade Node. **Check the VM's Node version in milestone 0.**

`src/lib/quiz/protocol.ts` holds only types and must be imported with `import type`, so the server can use it at zero runtime cost. `game-server/tsconfig.json` sets `erasableSyntaxOnly: true`, `allowImportingTsExtensions: true`, and `noEmit: true`. Extend `npm run typecheck` to `tsc --noEmit && tsc --noEmit -p game-server`.

---

## 5. Game server design

### 5.1 Configuration (env vars, in `game-server/.env`, gitignored)

```
QUIZ_PORT=9001
QUIZ_HOST_PASSWORD=...            # shared secret officers type into /quiz/host
QUIZ_SHEET_PUB_BASE=https://docs.google.com/spreadsheets/d/e/<id>/pub
QUIZ_INDEX_GID=0                  # tab listing available quizzes
QUIZ_MAX_GAMES=3                  # hard cap on concurrent games (compute bound)
QUIZ_MAX_PLAYERS=200              # per game
QUIZ_RESULTS_DIR=game-server/results
QUIZ_ALLOWED_ORIGINS=https://ieee.wpi.edu,https://ieee-dev.wpi.edu,http://localhost:3000
```

Read with `process.loadEnvFile()` (built into Node 21.7+), so there's no `dotenv` dependency.

### 5.2 Game state machine

```
LOBBY ──host:start──▶ INTRO ──(4s)──▶ OPEN ──(timer | all answered | host:skip)──▶ REVEAL
                        ▲                                                             │
                        │                                                   host:next │
                        └───────────── host:next ◀── SCOREBOARD ◀─────────────────────┘
                                                        │ (after last question) host:next
                                                        ▼
                                                     PODIUM ──host:end / 30 min──▶ ENDED (deleted)
```

- `INTRO`: 4 s default (question text readable on the projector, phones say "Get ready").
- `OPEN`: `timeLimit` from the sheet. The server keeps **one `setTimeout`** per game, and answers are timestamped on receipt with `performance.now()`.
- `REVEAL` → `SCOREBOARD` → next: host-advanced by default, so the MC can talk. An optional per-game "autoplay" flag advances after 5 s each.
- Every transition bumps a `phaseSeq` integer. Stale answers (wrong `qIndex`) are ignored.

```ts
type Player = {
  id: string;              // short random, public (used for kick, React keys)
  token: string;           // 128-bit random, secret; resume credential
  name: string;
  score: number;
  streak: number;
  totalCorrectMs: number;  // tie-break
  answers: (Answer | null)[];   // per question, for the results file
  socket: WebSocket | null;     // null while disconnected
  lastSeen: number;
};
type Answer = { choice: number; ms: number; correct: boolean; points: number };

class Game {
  pin: string; hostToken: string; hostSocket: WebSocket | null;
  quiz: Quiz; phase: Phase; qIndex: number; phaseSeq: number;
  openedAt: number; timer: NodeJS.Timeout | null;
  players: Map<string /*token*/, Player>;
  locked: boolean; banned: Set<string /*token*/>;
  createdAt: number; lastActivity: number;
}
```

`games: Map<pin, Game>` at module level. A 60-second sweep deletes games that have been `ENDED` for 30 min or idle for 2 h. That's the only background work.

### 5.3 Wire protocol (`src/lib/quiz/protocol.ts`)

JSON text frames, `{ t: "<type>", ...fields }`. Max inbound payload is **1 KB** (`maxPayload: 1024`), so oversized frames close the socket.

**Client → server**

| t | fields | who | notes |
|---|---|---|---|
| `host:create` | `password, quizGid` | host | → `host:created` |
| `host:resume` | `pin, hostToken` | host | projector refresh or reconnect |
| `host:listQuizzes` | `password` | host | reads the index tab |
| `host:start` / `host:next` / `host:skip` | — | host | skip = close the question now |
| `host:kick` | `playerId, ban?` | host | |
| `host:lock` | `locked` | host | stop new joins |
| `host:end` | — | host | writes results, moves to `ENDED` |
| `player:join` | `pin, name` | player | → `player:joined {token, id, name}` |
| `player:resume` | `pin, token` | player | → current snapshot |
| `player:answer` | `q, choice` | player | one per question; the first one counts |

**Server → host**

| t | fields |
|---|---|
| `host:created` | `pin, hostToken, quiz: {title, count}` |
| `lobby` | `players: {id,name}[], locked` |
| `intro` | `q, total, text, image?, type, timeMs, points` |
| `open` | `q, remainingMs, choices: string[]` |
| `progress` | `answered, total` (**throttled**: at most 4/s, coalesced) |
| `reveal` | `q, correct: number[], dist: number[]` |
| `scoreboard` | `top: {id,name,score,delta,streak}[]` (5), `q, total` |
| `podium` | `top3, count, resultsFile` |
| `error` | `code, message` |

**Server → player**

| t | fields |
|---|---|
| `player:joined` | `token, id, name` |
| `lobby` | `name` (phones don't need the whole player list) |
| `intro` | `q, total, nChoices, type` (**no text**) |
| `open` | `q, remainingMs, nChoices` |
| `ack` | `q` (answer received → "Waiting for others…") |
| `result` | `q, correct, points, streak, score, rank, behind?: {name, gap}` |
| `final` | `rank, score, count` |
| `kicked` | — |
| `error` | `code` (`BAD_PIN`, `LOCKED`, `NAME_TAKEN`, `NAME_REJECTED`, `FULL`, `RATE`) |

**Snapshots on resume.** When a host or player resumes, the server replays the one message that matches the current phase. For `open` it recomputes `remainingMs = deadline - now`. A resuming player who already answered also gets `ack`. So a refreshed tab lands exactly where it should.

**Clock skew.** Sending a *remaining duration* instead of an absolute deadline means device clocks never matter. Each client sets `localDeadline = performance.now() + remainingMs` when the message arrives.

### 5.4 Scoring (`scoring.ts`, pure, unit-tested)

```ts
const STREAK_STEP = 100, STREAK_CAP = 500;
export function questionPoints(correct: boolean, ms: number, limitMs: number, base: number) {
  if (!correct || base === 0) return 0;
  const t = Math.min(Math.max(ms, 0), limitMs);
  return Math.round((1 - t / limitMs / 2) * base);
}
export function streakBonus(streakAfter: number) {         // streakAfter ≥ 1 when correct
  return streakAfter <= 1 ? 0 : Math.min((streakAfter - 1) * STREAK_STEP, STREAK_CAP);
}
```

- The **response time** is measured **server-side**: `receivedAt - openedAt`. Latency is roughly uniform on campus Wi-Fi, so the unfairness is small and nobody can forge it. (A possible v2: accept a client-reported elapsed time clamped to `[serverElapsed - 500ms, serverElapsed]` to compensate for latency with bounded cheating.)
- **Grace window.** Answers arriving up to 300 ms after the deadline are accepted (network in flight) and scored as `t = limit`.
- **Early close.** When `answered === connected players`, close immediately. Players who are disconnected don't hold the question open.
- **Ranking and tie-break.** Sort by `score desc`, then `totalCorrectMs asc` (faster overall wins), then join order. Rank is 1-based, and the same sort is used everywhere.
- A **no-points** question (`points=none`, for warm-ups or icebreakers) still shows the distribution and doesn't touch streaks.

### 5.5 Joining, names, abuse

- **PIN:** 6 digits from `crypto.randomInt`, retried on collision, and never starting with 0 (people drop leading zeros).
- **Names:** trim, NFKC-normalize, strip control and zero-width characters, and limit to 1–16 grapheme clusters. Names must be unique per game (case-insensitive). They pass the `obscenity` English dataset and recommended transformers.
- **Nickname generator** (host toggle, on by default for big events): the phone gets a random `Adjective Animal` with up to 3 re-rolls, and typing is disabled. It's the best-known Kahoot-style anti-abuse control.
- **Kick / ban:** a kicked token is added to `banned`, so it can't resume. The phone gets `kicked`.
- **Lock:** the host can lock the lobby once everyone's in, which stops PIN leak drive-bys.
- **Rate limits** (token buckets in memory):
  - Per socket: 10 messages/s burst, 5/s sustained. Exceeding it closes the socket.
  - `player:join` per IP: generous (**60/min**) because **many students share campus NAT addresses**. Get the IP from `X-Forwarded-For` (Apache sets it, so trust only when the remote address is 127.0.0.1).
  - Failed PIN lookups per IP: 20/min, which makes brute-forcing 900k PINs impractical.
- **Origin check** on the upgrade request against `QUIZ_ALLOWED_ORIGINS`, to block other sites' pages from opening sockets.
- **Caps:** `QUIZ_MAX_GAMES` and `QUIZ_MAX_PLAYERS` bound worst-case memory no matter what.

### 5.6 Connections, heartbeats, reconnection

- Server: `ws` ping every **25 s**. A socket that misses a pong is terminated, but the **player record is kept** (`socket = null`) for the whole game. The 25 s cadence also keeps Apache's and NAT idle timeouts from firing between questions.
- Client (`use-quiz-socket.ts`):
  - Save `{pin, token}` in `localStorage` (key `quiz:<pin>`) right after `player:joined`.
  - On load, if a stored token exists for a live PIN, send `player:resume` instead of showing the join form. That's how **refresh keeps your score**, which Kahoot itself doesn't do.
  - Reconnect with exponential backoff (0.5 s → 8 s, jittered). On `visibilitychange` → visible and on `online`, reconnect **immediately**, since phones suspend sockets when the screen locks.
  - **Screen Wake Lock API** (`navigator.wakeLock.request('screen')`) while in a game, where supported (Android Chrome, iOS 16.4+). It's the single biggest fix for mid-game drops, because phones stop sleeping during a 20 s question.
  - Show a small "Reconnecting…" banner, and never a blank screen.
- Host: the same resume flow with `hostToken` in `sessionStorage`. If the projector laptop sleeps or the tab refreshes, the game keeps running on the server and the host screen recovers its current phase. While no host is connected, the server **won't auto-advance past REVEAL**, so nothing moves on without the MC.

### 5.7 Results persistence

On `PODIUM` (and on `host:end` if earlier), write:

- `results/2026-10-14_482913.json`: quiz title and gid, timestamps, questions (text + correct answers), and per player `{name, score, rank, answers[]}`.
- `results/2026-10-14_482913.csv`: `rank,name,score,correct_count,avg_correct_ms`, one row per player. Opens in Excel for prize and attendance use.

Served by the game server's plain HTTP handler at `GET /quiz-ws/results/<file>?key=<hostToken or password>`, and linked from the host podium screen as "Download results (CSV)". The host page also has a "Past results" list (password-gated `GET /quiz-ws/results`). Writes are synchronous and tiny. Files never auto-delete; each is a few KB.

**Privacy note:** results contain only self-chosen nicknames, with no emails or WPI IDs. If officers later want attendance tracking, that's a separate decision (opt-in field, retention policy).

---

## 6. Front-end design

### 6.1 Escaping the site chrome

The root layout wraps every page in Navbar and Footer, and the quiz screens must be full-screen. Two options:

1. **Route groups (recommended).** Move the existing pages into `src/app/(site)/` with a `(site)/layout.tsx` that renders Navbar and Footer. The root `layout.tsx` keeps only `<html>/<body>`, global CSS and metadata. `src/app/quiz/layout.tsx` stays bare. URLs don't change, and it's all `git mv` plus about 10 lines of layout.
2. Quick hack: render the quiz UI as `fixed inset-0 z-50` over the chrome. It works, but phones still download and hydrate the navbar JS during the join burst.

Go with option 1, and do it as its own commit before any quiz code.

### 6.2 Player page (`/quiz`), phone-first

Keep it light. It's the page 150 phones hit at once.

- `app/quiz/page.tsx` is a server component that exports `metadata` and renders `<Player />` (`"use client"`), the same pattern as `games`/`wordle`. The page is statically prerendered, with no data fetching.
- No `next/image`, no web fonts beyond the site's, no chart library, no QR library. Target **< 60 KB JS gzipped** for the route (check it in the `next build` output).
- Supports `/quiz?pin=482913` so the QR code prefills the PIN.
- Screens: `Join (PIN)` → `Name` (or generator) → `Lobby "You're in! See your name on screen"` → `Get ready (Q n/N)` → `Tiles` (2 or 4 big shape buttons covering the viewport; 2 for T/F) → `Answered, waiting…` → `Result (✓/✗, +points, streak 🔥, rank, "N pts behind <name>")` → … → `Final (rank / count)`.
- Tiles: full-bleed 2×2 grid, each tile at least 45% of the viewport height, with shape plus color **and** an `aria-label` ("Red triangle"). Feedback on `pointerdown` makes it feel instant, and the button disables after the first tap.
- Haptics: `navigator.vibrate(30)` on answer, where supported.

### 6.3 Host page (`/quiz/host`), 16:9 projector

- `app/quiz/host/page.tsx` sets `robots: { index: false }`.
- Flow: **Password** → **Pick quiz** (from the Sheet index, with a "validate" preview listing any row errors) → **Settings** (name generator on/off, autoplay, music on/off) → **Lobby** → game → **Podium** → **Download CSV / Play again**.
- Lobby: a big PIN, the join URL `ieee.wpi.edu/quiz`, a QR code (lazy-loaded), a player count, and the name cloud (click a name to kick it). Includes a Lock toggle and a Start button (disabled until at least 1 player joins).
- Question: the question text in large type, image centered (`max-height: 45vh`, plain `<img>`, preloaded during INTRO), a countdown ring, an "answered N/M" counter, and four tiles with shape plus text.
- Reveal: tiles dim except the correct ones, and the distribution bars animate up (CSS `transform: scaleY`).
- Scoreboard: top 5 with FLIP-style reorder animation from the previous order, showing `+delta` and 🔥streak.
- Podium: 3rd, then 2nd, then 1st, about 1.5 s apart with drumroll and fanfare, and CSS confetti (no library).
- Keyboard: `Space`/`→` = next, `S` = skip, `M` = mute, `F` = fullscreen. The MC may have a clicker, and clickers send arrow keys.
- Type is sized with `clamp()` and `vw` so it reads on a 720p projector from the back of a lecture hall.

### 6.4 Sound (host only)

- Phones play **nothing**. That's Kahoot's model too, and it avoids 150 phones blaring out of sync.
- `sound.ts` uses a single `HTMLAudioElement` per track, all preloaded in the lobby. **Browser autoplay policy**: audio can only start after a user gesture, and the host's "Create game" click counts. Call `play().then(pause)` on each track there to unlock them.
- Tracks: lobby loop, question loop (one tempo is enough for v1), 5 s countdown sting, reveal sting, podium fanfare. Includes a mute toggle, remembered in `localStorage`.
- **Licensing: CC0 only** (e.g. Pixabay music, Freesound CC0 filter, OpenGameArt CC0). **Do not rip Kahoot's music**, which is copyrighted. Record the source URL and license of each file in `public/quiz/sfx/CREDITS.md`.
- Keep files small: mono, 96 kbps MP3, loops under 60 s. That's about 2 MB total, fetched once by one browser.

### 6.5 Styling

Tailwind plus the existing tokens. Add `quiz-red #E21B3C`, `quiz-blue #1368CE`, `quiz-yellow #D89E00`, `quiz-green #26890C` to `tailwind.config.js` (Kahoot-like, and all pass white-text contrast). Frame it with IEEE navy `#002855` (backgrounds and header), so it reads as *our* game rather than a Kahoot knock-off. Don't use Kahoot's name or logo anywhere in the UI. Call it something like **"IEEE Live Quiz"**.

---

## 7. Quiz authoring via Google Sheets

### 7.1 Sheet layout

One spreadsheet, published to the web (File → Share → Publish to web → CSV). Officers duplicate a template tab per quiz.

**Tab `Index`** (gid in `QUIZ_INDEX_GID`):

| title | gid | enabled |
|---|---|---|
| GBM Trivia — Oct 2026 | 123456789 | TRUE |
| Circuits Night | 987654321 | FALSE |

**One tab per quiz:**

| type | question | image | time | points | a1 | a2 | a3 | a4 | correct |
|---|---|---|---|---|---|---|---|---|---|
| quiz | What does IEEE stand for? | | 20 | standard | Institute of Electrical and Electronics Engineers | … | … | … | 1 |
| tf | Ohm's law is V = IR | | 10 | standard | | | | | true |
| quiz | Which is a passive component? | https://ieee.wpi.edu/quiz/img/q3.png | 20 | double | Transistor | Resistor | Op-amp | Capacitor | 2,4 |

Validation rules (enforced in `quiz-source.ts`, errors reported per row on the host's preview screen):

- `type` ∈ `quiz | tf`.
- `time` ∈ {5, 10, 20, 30, 45, 60, 90, 120, 240}.
- `points` ∈ `standard | double | none`.
- `quiz`: 2–4 non-empty answers, each ≤ 75 chars; `correct` is a list of 1-based indexes, all pointing at non-empty answers.
- `tf`: answers ignored; `correct` ∈ `true | false`.
- `question` ≤ 120 chars; `image` empty or an `https://` URL.
- 1–100 questions. Blank rows are skipped, and a row whose first cell starts with `#` is a comment.

### 7.2 Fetching

- The **game server** fetches the CSV (`${QUIZ_SHEET_PUB_BASE}?gid=${gid}&single=true&output=csv`) at `host:create`, and snapshots it into the `Game`. Editing the sheet mid-game doesn't affect a running game.
- A 60 s in-memory cache per gid stops repeated "validate" clicks from hammering Google.
- The answer key never goes to phones. The published base URL lives only in the server env, not in the client bundle.
  - **Caveat:** "publish to web" CSVs are public *to anyone who has the URL*. The URL is unguessable, but students who saw it in the Wordle source (same spreadsheet) could find it. **Use a separate spreadsheet for quizzes**, and don't commit its URL (put it in `.env`).
- Failure (Google down, sheet unpublished): the host screen shows the error and nothing starts. No live game ever depends on Google once it has begun.

### 7.3 Images

The projector is the only thing that loads them, so hosting cost is negligible either way. In order of preference:

1. `public/quiz/img/…` in the repo: reliable and served by Next static, but it needs a deploy.
2. Any stable `https` image URL (Wikimedia Commons, imgur).
3. **Avoid Google Drive share links.** Drive's hotlink URLs (`uc?export=view`) are unreliable and get rate-limited. Document this in the sheet template's notes row.

The host preloads each question's image during the lobby (all of them, via `new Image()`). A broken image shows a neutral placeholder, and the game continues.

---

## 8. Security summary

| Threat | Mitigation |
|---|---|
| Players reading answers | The answer key stays on the server until reveal; phones never receive question or answer text |
| Forged fast answers | Server-side timing; one answer per question per token; stale `q` ignored |
| Host takeover | `QUIZ_HOST_PASSWORD` checked at create; after that a 128-bit `hostToken`, compared with `crypto.timingSafeEqual` |
| PIN brute force / drive-bys | 6-digit PINs, a failed-lookup limit per IP, lobby lock, kick/ban |
| Offensive names | `obscenity` filter, nickname generator mode, host kick |
| Floods / oversized frames | `maxPayload: 1024`, per-socket token bucket, game and player caps |
| Cross-site socket abuse | Origin allow-list on upgrade |
| Next.js WS-upgrade SSRF (CVE-2026-44578) | Fixed in Next ≥ 16.2.5; we're on **16.3.7** ✅. Our WS doesn't touch Next anyway |
| Results leakage | Results endpoint requires the host password or token; file names are validated against `^\d{4}-\d{2}-\d{2}_\d{6}\.(json|csv)$` (no path traversal) |

---

## 9. Deployment changes

### 9.1 Apache (`apache/000-default.conf`)

Requires Apache ≥ 2.4.47 for `upgrade=websocket` (check `apache2 -v`), plus `a2enmod proxy_wstunnel`. The quiz block goes **before** the catch-all `ProxyPass /`, because order matters:

```apache
    # Live quiz game server (WebSocket + small HTTP API) on :9001
    ProxyPass        /quiz-ws/ http://localhost:9001/ upgrade=websocket retry=0 timeout=120
    ProxyPassReverse /quiz-ws/ http://localhost:9001/

    ProxyPass /maintenance.html !
    ...
    ProxyPass / http://localhost:9000/ retry=0
```

With an application ping every 25 s, the 120 s timeout is never reached on a healthy socket. On Apache < 2.4.47, use `ProxyPass /quiz-ws/ ws://localhost:9001/` together with a `RewriteRule` for the HTTP results endpoint. Note that path `/quiz` (Next page) and `/quiz-ws/` (game server) are distinct prefixes. Keep the trailing slash.

If the game server is down, the upgrade gets Apache's 503. The client shows "Quiz server is offline, ask an officer", not the maintenance page.

### 9.2 package.json scripts

```json
"quiz:server": "node game-server/index.ts",
"quiz:dev":    "node --watch game-server/index.ts",
"quiz:test":   "node --test game-server/",
"quiz:bots":   "node game-server/scripts/bots.ts",
"typecheck":   "tsc --noEmit && tsc --noEmit -p game-server"
```

Client connection URL: `NEXT_PUBLIC_QUIZ_WS_URL` when set (dev: `ws://localhost:9001`), otherwise derived as `${https ? 'wss' : 'ws'}://${location.host}/quiz-ws/`. Next dev's rewrites don't reliably proxy WebSocket upgrades, hence the env var.

### 9.3 `deploy.sh`: stop killing the game on site deploys

Today `tmux kill-server` kills everything. Change it to:

```bash
tmux kill-session -t prod 2>/dev/null || true
tmux new -d -s prod "npm run deploy"
# game server: start only if not already running; never restarted by a site deploy
tmux has-session -t quiz 2>/dev/null || tmux new -d -s quiz "npm run quiz:server"
```

Add `deploy-quiz.sh` (or `./deploy.sh --quiz`) that restarts the `quiz` session explicitly, with a warning that it ends any live games. `tmux new` without `-d` would block the script; the current script attaches, so decide whether to keep that behavior for `prod`.

A reboot kills both, and that's already true of the site. Optional hardening later: systemd units for both, with `Restart=on-failure` and `MemoryMax=150M` for the game server.

### 9.4 Idle footprint

About 45 MB RSS and ~0% CPU when no game is running (no timers besides the 60 s sweep). If even that's too much, the runbook can say "start the `quiz` tmux session before the event, kill it after". The code needs no changes for that.

Node flag: `node --max-old-space-size=96 game-server/index.ts` caps the heap, so a bug can't starve the site.

---

## 10. Milestones

Each milestone ends with `npm run typecheck` clean, and is one or a few commits.

| # | Milestone | Deliverables | Done when |
|---|---|---|---|
| 0 | **Recon on the VM** | Record `node -v`, `apache2 -v`, free RAM, `a2query -m proxy_wstunnel` | Versions are in this doc; Node ≥ 22.18, or the plan switches to `tsx` |
| 1 | **Route-group refactor** | `(site)` group, root layout slimmed | Every existing URL renders identically; build passes |
| 2 | **Protocol + game server core** | `protocol.ts`, `game.ts`, `scoring.ts`, `index.ts`, hardcoded sample quiz | `quiz:test` passes (scoring, tie-break); a wscat session can play a game |
| 3 | **Load test** | `scripts/bots.ts`: N bots join, answer randomly after 0.5–8 s, and randomly disconnect and resume | 200 bots locally: no errors, RSS < 80 MB, and stale/duplicate answers are rejected |
| 4 | **Player UI** | `/quiz` all screens, reconnect, wake lock, localStorage resume | Playable on a real iPhone and Android over Wi-Fi; refresh mid-question keeps the score |
| 5 | **Host UI** | `/quiz/host` lobby, QR, question, reveal, scoreboard, podium, keyboard controls | Full game on a projector-sized window; host refresh resumes |
| 6 | **Sheets integration** | `csv.ts`, `quiz-source.ts`, index tab, validation preview, template sheet | A new quiz tab plays without a redeploy; bad rows are reported clearly |
| 7 | **Sound + images** | `sound.ts`, CC0 tracks + CREDITS, image preload | Audio starts after the Create click; mute works; a broken image doesn't break the game |
| 8 | **Results** | JSON/CSV writer, download + past-results list | The CSV opens in Excel with correct ranks |
| 9 | **Hardening** | Rate limits, origin check, name filter + generator, kick/ban/lock, caps | A bot flood from one IP gets throttled; the name filter blocks the test list |
| 10 | **Deploy to dev** | Apache block, `deploy.sh` change, `.env` on the VM | Bots against `ieee-dev.wpi.edu` (100–150 of them from a laptop): watch `top`, and site pages stay fast |
| 11 | **Officer dry run** | 10–20 real phones on campus Wi-Fi, one full quiz | Collect issues and fix them; then use it at a GBM |
| 12 | **Docs** | Update `CLAUDE.md` (new process, `"use client"` list, quiz sheet) and a README section | |

Suggested order for the fastest demo: 0 → 2 → 4 → 5 (with the hardcoded quiz) gives a playable game. Then do 1, 6, 7, 8, 9 and deploy.

---

## 11. Testing strategy

There's no existing test suite, so add the minimum with **zero new dependencies**:

- **`node:test` unit tests** in `game-server/*.test.ts`:
  - Scoring: t=0 → 1000, t=limit → 500, double, none, and the streak cap.
  - The tie-break order.
  - The CSV parser: quoted commas, escaped quotes, CRLF, trailing newline.
  - Quiz validation: every rule in §7.1.
  - The state machine: early close when all have answered; stale `q` ignored; duplicate answer ignored; a resume snapshot in each phase.
- **Bot load test** (`scripts/bots.ts`) using the `ws` client. Flags: `--url --pin --n 150 --dropRate 0.1`. It doubles as the pre-event smoke test against production.
- **Manual device matrix:** iOS Safari, Android Chrome, one old phone. Cases: lock the screen mid-question, switch Wi-Fi to cellular, refresh.
- `npm run typecheck` stays the gate before each commit.

---

## 12. Event-day runbook (goes in README)

1. Day before: `tmux ls` on the VM should show `quiz`. Run `npm run quiz:bots -- --url wss://ieee.wpi.edu/quiz-ws/ --n 50` against a throwaway game.
2. Open `ieee.wpi.edu/quiz/host` on the projector laptop. Enter the password, pick the quiz, and check that the validation preview shows 0 errors.
3. Click **Create game** (this unlocks audio), then press `F` for fullscreen. Disable the laptop's sleep.
4. Lock the lobby once the player count stops rising. Press Start.
5. If the projector tab dies, reopen `/quiz/host` in the same browser and it resumes.
6. After the podium, click **Download results (CSV)**.
7. **Don't run `deploy-quiz.sh` during an event.** `deploy.sh` (the site) is safe.

---

## 13. Risks and open questions

| Risk / question | Plan |
|---|---|
| VM's Node too old for native TS | Milestone 0. Fallback: `tsx` devDependency, or upgrade Node (recommended anyway) |
| Apache < 2.4.47 | Use the `ws://` + `mod_proxy_wstunnel` form (§9.1) |
| Campus Wi-Fi blocks or kills WebSockets | Unlikely, since it's `wss` on 443. Verify in milestone 11. If it happens, add an SSE + POST fallback transport to the same game server (the protocol is already message-shaped) |
| Game-server crash mid-game loses the game | Accepted for v1. Optional v2: snapshot `Game` to disk on each phase change and reload at boot |
| The published sheet is technically public | Separate spreadsheet, URL only in `.env` (§7.2). For real secrecy, a v2 could use a Google service account and the Sheets API |
| Two officers want games at the same time | Supported (`QUIZ_MAX_GAMES=3`) |
| Future growth past ~400 players | The same design holds to the low thousands on this VM. Past that, move the transport to Supabase Realtime / Ably (§3.1 G) |
| Name for the feature / nav placement | Proposed "IEEE Live Quiz". Link it from `/games`, not the main navbar, since players arrive via QR |

---

## Appendix: sources (from research agents)

- Scoring formula: https://support.kahoot.com/hc/articles/115002303908
- Scoreboard / podium: https://support.kahoot.com/hc/en-us/articles/360039900153 , https://support.kahoot.com/hc/en-us/community/posts/40636423376147-Podium-Celebration
- Reports export: https://support.kahoot.com/hc/articles/360035063054
- Nicknames, kicking, generator: https://kahoot.com/blog/2019/03/08/tips-keep-kahoot-nicknames-appropriate/
- Reconnect behavior (refresh = new player at 0): https://support.kahoot.com/hc/en-us/community/posts/115000985067
- Multi-select, no partial credit: https://kahoot.com/blog/2020/04/27/deeper-learning-accuracy-multi-select-kahoot-answers/
- Streak bonus values: https://www.digitalcitizen.life/how-to-always-win-a-kahoot/ (secondary source)
- Open-source clones: ClassQuiz (FastAPI + python-socketio + Postgres/Redis), Rahoot (Node, MIT, "for smaller events")
- Next.js custom server tradeoffs: https://nextjs.org/docs/app/guides/custom-server
- next-ws: https://npmjs.com/package/next-ws
- CVE-2026-44578 (Next WS-upgrade SSRF, fixed 16.2.5): https://www.sonicwall.com/blog/next-js-websocket-upgrade-handler-ssrf
- Apache mod_proxy_wstunnel / `upgrade=websocket`: https://httpd.apache.org/docs/trunk/mod/mod_proxy_wstunnel.html
- WS memory per connection: https://socket.io/docs/v4/memory-usage/ , https://evilmartians.com/chronicles/choose-your-fighter-benchmarking-5-websocket-servers-for-nodejs
- Free-tier realtime limits: Firebase RTDB https://firebase.google.com/docs/database/usage/limits , Supabase https://supabase.com/docs/guides/realtime/limits , Ably https://ably.com/docs/pricing/free , Cloudflare DO https://developers.cloudflare.com/durable-objects/platform/pricing
- `obscenity` vs `bad-words`: https://npmjs.com/package/@achivx/obscenity

Unverified claims from the research, flagged: the exact tie-break rule (undocumented), the "N points behind" phone message (widely reported, no primary source), Kahoot's historical CometD transport (unconfirmed), and the exact streak values (secondary source only).
