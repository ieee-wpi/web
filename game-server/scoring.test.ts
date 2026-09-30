import assert from "node:assert/strict";
import { test } from "node:test";
import { basePoints, compareStanding, questionPoints, streakBonus } from "./scoring";

test("questionPoints follows the Kahoot formula", () => {
  assert.equal(questionPoints(true, 0, 20_000, 1000), 1000);
  assert.equal(questionPoints(true, 20_000, 20_000, 1000), 500);
  assert.equal(questionPoints(true, 10_000, 20_000, 1000), 750);
  assert.equal(questionPoints(true, 0, 20_000, 2000), 2000);
  assert.equal(questionPoints(false, 0, 20_000, 1000), 0);
  assert.equal(questionPoints(true, 0, 20_000, 0), 0);
  // Clamped: late (grace window) scores as the buzzer, negative as instant.
  assert.equal(questionPoints(true, 25_000, 20_000, 1000), 500);
  assert.equal(questionPoints(true, -5, 20_000, 1000), 1000);
});

test("basePoints", () => {
  assert.equal(basePoints("standard"), 1000);
  assert.equal(basePoints("double"), 2000);
  assert.equal(basePoints("none"), 0);
});

test("streakBonus ramps by 100 and caps at 500", () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 7, 20].map(streakBonus), [0, 100, 200, 300, 400, 500, 500, 500]);
});

test("ranking: score, then total correct time, then join order", () => {
  const players = [
    { name: "slow", score: 1000, totalCorrectMs: 9000, joinOrder: 0 },
    { name: "late", score: 1000, totalCorrectMs: 3000, joinOrder: 2 },
    { name: "fast", score: 1000, totalCorrectMs: 3000, joinOrder: 1 },
    { name: "top", score: 1500, totalCorrectMs: 99999, joinOrder: 3 },
  ];
  assert.deepEqual(players.sort(compareStanding).map((p) => p.name), ["top", "fast", "late", "slow"]);
});
