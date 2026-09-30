import "./test-env";
import assert from "node:assert/strict";
import { test } from "node:test";
import { Game, type Conn, type Player } from "./game";
import type { ServerMessage } from "./protocol";
import type { Quiz } from "./quiz-source";

const quiz: Quiz = {
  id: "local:test",
  title: "Test",
  questions: [
    { type: "quiz", text: "Q1", image: null, timeMs: 10_000, points: "standard", choices: ["a", "b", "c", "d"], correct: [1] },
    { type: "tf", text: "Q2", image: null, timeMs: 10_000, points: "double", choices: ["True", "False"], correct: [0] },
  ],
};

class FakeConn implements Conn {
  msgs: ServerMessage[] = [];
  closed = false;
  send(m: ServerMessage) {
    this.msgs.push(m);
  }
  close() {
    this.closed = true;
  }
  last<T extends ServerMessage["t"]>(t: T) {
    return [...this.msgs].reverse().find((m) => m.t === t) as Extract<ServerMessage, { t: T }> | undefined;
  }
}

function errorOf(result: unknown) {
  return (result as { error?: string }).error;
}

function setup(settings = { nameGenerator: false, autoplay: false }) {
  let clock = 0;
  const game = new Game("123456", "hosttoken", quiz, settings, () => clock);
  const host = new FakeConn();
  game.attachHost(host);
  const join = (name: string) => {
    const c = new FakeConn();
    const p = game.join(c, name);
    assert.ok(!("error" in p), `join ${name}`);
    return { c, p: p as Player };
  };
  return { game, host, join, tick: (ms: number) => (clock += ms) };
}

test("full game: scoring, streaks, early close, podium", (t) => {
  const { game, host, join, tick } = setup();
  t.after(() => game.dispose());
  const alice = join("Alice");
  const bob = join("Bob");
  assert.equal(host.last("lobby")?.players.length, 2);

  game.start();
  assert.equal(game.phase, "intro");
  assert.equal(alice.c.last("p:intro")?.nChoices, 4);
  game.next(); // intro -> open without waiting for the timer
  assert.equal(game.phase, "open");
  // Phones never see question text or answer text.
  assert.ok(!JSON.stringify(alice.c.msgs).includes("Q1"));

  game.answer(alice.p, 0, 1); // correct, instant
  game.answer(alice.p, 0, 2); // second answer ignored
  assert.equal(game.phase, "open");
  tick(5_000);
  game.answer(bob.p, 0, 3); // wrong -> everyone answered -> closes early
  assert.equal(game.phase, "reveal");
  assert.deepEqual(host.last("reveal")?.dist, [0, 1, 0, 1]);
  assert.equal(alice.c.last("p:result")?.points, 1000);
  assert.equal(alice.c.last("p:result")?.rank, 1);
  assert.deepEqual(bob.c.last("p:result")?.behind, { name: "Alice", gap: 1000 });

  game.next(); // scoreboard
  assert.equal(host.last("scoreboard")?.top[0].name, "Alice");
  game.next(); // Q2 intro
  game.next(); // open
  tick(10_000);
  game.answer(alice.p, 1, 0); // correct at the buzzer, double: 1000 + streak bonus 100
  game.answer(bob.p, 1, 0); // correct at the buzzer: 1000
  assert.equal(alice.c.last("p:result")?.points, 1100);
  assert.equal(alice.c.last("p:result")?.streak, 2);
  assert.equal(bob.c.last("p:result")?.points, 1000);

  game.next(); // last question -> podium (skips scoreboard)
  assert.equal(game.phase, "podium");
  const podium = host.last("podium")!;
  assert.deepEqual(
    podium.top.map((s) => [s.name, s.score]),
    [
      ["Alice", 2100],
      ["Bob", 1000],
    ],
  );
  assert.match(podium.resultsFile ?? "", /_123456\.csv$/);
  assert.deepEqual(bob.c.last("p:final"), { t: "p:final", rank: 2, score: 1000, count: 2 });
});

test("stale and invalid answers are ignored", (t) => {
  const { game, join } = setup();
  t.after(() => game.dispose());
  const a = join("A");
  join("B");
  game.start();
  game.answer(a.p, 0, 1); // intro, not open yet
  game.next();
  game.answer(a.p, 5, 1); // wrong question index
  game.answer(a.p, 0, 9); // out of range
  game.answer(a.p, 0, "1"); // not a number
  assert.equal(a.p.answers[0], null);
});

test("resume restores the phase and keeps the score", (t) => {
  const { game, join, tick } = setup();
  t.after(() => game.dispose());
  const a = join("A");
  const b = join("B");
  game.start();
  game.next();
  game.answer(a.p, 0, 1);
  game.detach(a.c); // phone locked
  const again = new FakeConn();
  tick(2_000);
  assert.ok(game.resume(again, a.p.token));
  assert.equal(again.last("p:open")?.remainingMs, 8_000);
  assert.ok(again.last("p:ack"), "already answered");
  game.answer(b.p, 0, 1);
  assert.equal(again.last("p:result")?.points, 1000);
});

test("disconnected players don't hold the question open", (t) => {
  const { game, join } = setup();
  t.after(() => game.dispose());
  const a = join("A");
  const b = join("B");
  game.start();
  game.next();
  game.answer(a.p, 0, 1);
  assert.equal(game.phase, "open");
  game.detach(b.c);
  assert.equal(game.phase, "reveal");
});

test("names: unique, filtered, kicked players can't resume", (t) => {
  const { game, join } = setup();
  t.after(() => game.dispose());
  const a = join("Alice");
  assert.equal(errorOf(game.join(new FakeConn(), " alice ")), "NAME_TAKEN");
  assert.equal(errorOf(game.join(new FakeConn(), "")), "NAME_REJECTED");
  assert.equal(errorOf(game.join(new FakeConn(), "x".repeat(17))), "NAME_REJECTED");
  game.kick(a.p.id);
  assert.ok(a.c.last("kicked"));
  const back = new FakeConn();
  assert.equal(game.resume(back, a.p.token), null);
  assert.ok(back.last("kicked"));
  game.setLocked(true);
  assert.equal(errorOf(game.join(new FakeConn(), "Carol")), "LOCKED");
});

test("host resume replays the current phase", (t) => {
  const { game, join } = setup();
  t.after(() => game.dispose());
  const a = join("A");
  game.start();
  game.next();
  game.answer(a.p, 0, 1);
  const projector = new FakeConn();
  game.attachHost(projector);
  assert.equal(projector.last("host:created")?.pin, "123456");
  assert.equal(projector.last("reveal")?.q, 0);
});
