"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import { SHAPES } from "@/lib/quiz/shapes";
import { useQuizSocket, useWakeLock } from "@/lib/quiz/use-quiz-socket";
import ShapeIcon from "@/components/quiz/shape-icon";
import { CountdownBar } from "@/components/quiz/countdown";
import type { ClientMessage, PlayerMessage, QuestionType, ServerMessage } from "../../../game-server/protocol";

type ResultMsg = Extract<PlayerMessage, { t: "p:result" }>;

type View =
  | { k: "pin" }
  | { k: "name"; generator: boolean; suggestion: string; rerolls: number }
  | { k: "lobby" }
  | { k: "intro"; q: number; total: number }
  | { k: "open"; q: number; total: number; nChoices: number; type: QuestionType; deadline: number; timeMs: number }
  | { k: "answered"; q: number; total: number }
  | { k: "result"; r: ResultMsg }
  | { k: "final"; rank: number; score: number; count: number }
  | { k: "ended" }
  | { k: "kicked" };

const SESSION_KEY = "quiz:player";
const MAX_REROLLS = 3;

type Session = { pin: string; token: string };
function loadSession(): Session | null {
  try {
    const s = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null");
    return s && typeof s.pin === "string" && typeof s.token === "string" ? s : null;
  } catch {
    return null;
  }
}
function saveSession(s: Session | null) {
  try {
    if (s) localStorage.setItem(SESSION_KEY, JSON.stringify(s));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // storage blocked: refresh will mean re-joining, nothing worse
  }
}

function ordinal(n: number) {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0]);
}

export default function Player() {
  const [view, setView] = useState<View>({ k: "pin" });
  const [pin, setPin] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [name, setName] = useState("");
  const [score, setScore] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const choiceRef = useRef<number | null>(null);
  const resuming = useRef(false);

  // Prefill from the QR code link: /quiz?pin=123456
  useEffect(() => {
    const p = new URLSearchParams(window.location.search).get("pin");
    if (p && /^\d{6}$/.test(p)) setPin(p);
  }, []);

  const onOpen = useCallback((send: (m: ClientMessage) => void) => {
    const s = loadSession();
    if (s) {
      resuming.current = true;
      send({ t: "player:resume", pin: s.pin, token: s.token });
    }
  }, []);

  const onMessage = useCallback((m: ServerMessage) => {
    setBusy(false);
    switch (m.t) {
      case "player:pinOk":
        setError(null);
        setPin(m.pin);
        setNameInput(m.nameGenerator ? m.suggestion : "");
        setView((v) => ({ k: "name", generator: m.nameGenerator, suggestion: m.suggestion, rerolls: v.k === "name" ? v.rerolls + 1 : 0 }));
        break;
      case "player:joined":
        resuming.current = false;
        setError(null);
        setName(m.name);
        saveSession({ pin: m.pin, token: m.token });
        break;
      case "p:lobby":
        setView({ k: "lobby" });
        break;
      case "p:intro":
        choiceRef.current = null;
        setView({ k: "intro", q: m.q, total: m.total });
        break;
      case "p:open":
        setView((v) =>
          v.k === "answered" && v.q === m.q
            ? v
            : { k: "open", q: m.q, total: m.total, nChoices: m.nChoices, type: m.type, deadline: performance.now() + m.remainingMs, timeMs: m.timeMs },
        );
        break;
      case "p:ack":
        setView((v) => (v.k === "open" || v.k === "answered" ? { k: "answered", q: m.q, total: v.total } : v));
        break;
      case "p:result":
        setScore(m.score);
        setView({ k: "result", r: m });
        if ("vibrate" in navigator) navigator.vibrate(m.correct ? 40 : [30, 60, 30]);
        break;
      case "p:final":
        setScore(m.score);
        setView({ k: "final", rank: m.rank, score: m.score, count: m.count });
        break;
      case "p:ended":
        saveSession(null);
        setView((v) => (v.k === "final" ? v : { k: "ended" }));
        break;
      case "kicked":
        saveSession(null);
        setView({ k: "kicked" });
        break;
      case "error":
        if (m.code === "BAD_TOKEN" && resuming.current) {
          // Stale session from an earlier game: start fresh, quietly.
          resuming.current = false;
          saveSession(null);
          setView({ k: "pin" });
          return;
        }
        setError(m.message);
        if (m.code === "BAD_PIN" || m.code === "LOCKED" || m.code === "FULL") setView({ k: "pin" });
        break;
    }
  }, []);

  const { status, send } = useQuizSocket({ onMessage, onOpen });
  const inGame = !["pin", "name", "ended", "kicked", "final"].includes(view.k);
  useWakeLock(inGame);

  const submitPin = (e: React.FormEvent) => {
    e.preventDefault();
    const p = pin.replace(/\D/g, "");
    if (p.length !== 6) return setError("The game PIN has 6 digits.");
    setError(null);
    if (send({ t: "player:checkPin", pin: p })) setBusy(true);
    else setError("Connecting to the game server...");
  };

  const submitName = (e: React.FormEvent) => {
    e.preventDefault();
    const n = nameInput.trim();
    if (!n) return setError("Enter a nickname.");
    setError(null);
    if (send({ t: "player:join", pin, name: n })) setBusy(true);
  };

  const answer = (choice: number) => {
    if (view.k !== "open") return;
    choiceRef.current = choice;
    send({ t: "player:answer", q: view.q, choice });
    if ("vibrate" in navigator) navigator.vibrate(20);
    setView({ k: "answered", q: view.q, total: view.total });
  };

  const leave = () => {
    saveSession(null);
    setView({ k: "pin" });
    setScore(0);
    setName("");
    setError(null);
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-[#002855] text-white">
      {status !== "open" && view.k !== "pin" && (
        <div className="bg-amber-500 px-4 py-1 text-center text-sm font-semibold text-black" role="status">
          {status === "offline" ? "Can't reach the game server. Still trying..." : "Reconnecting..."}
        </div>
      )}

      {inGame && (view.k === "open" || view.k === "intro" || view.k === "answered") && (
        <div className="flex items-center justify-between px-4 py-2 text-sm font-semibold">
          <span>
            Question {view.q + 1} of {view.total}
          </span>
          <span className="tabular-nums">{score.toLocaleString()} pts</span>
        </div>
      )}
      {view.k === "open" && <CountdownBar deadline={view.deadline} totalMs={view.timeMs} />}

      <main className="flex flex-1 flex-col">
        {view.k === "pin" && (
          <Centered>
            <h1 className="mb-6 text-3xl font-extrabold tracking-tight">IEEE Live Quiz</h1>
            <form onSubmit={submitPin} className="flex w-full max-w-xs flex-col gap-3">
              <label htmlFor="pin" className="sr-only">
                Game PIN
              </label>
              <input
                id="pin"
                inputMode="numeric"
                autoComplete="off"
                maxLength={7}
                placeholder="Game PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/[^\d ]/g, ""))}
                className="rounded-md px-4 py-3 text-center text-2xl font-bold tracking-[0.3em] text-black placeholder:tracking-normal"
              />
              <BigButton disabled={busy || status !== "open"}>{status === "open" ? "Enter" : "Connecting..."}</BigButton>
            </form>
            <ErrorText error={error} />
          </Centered>
        )}

        {view.k === "name" && (
          <Centered>
            <p className="mb-2 text-sm opacity-80">Game {pin}</p>
            <form onSubmit={submitName} className="flex w-full max-w-xs flex-col gap-3">
              {view.generator ? (
                <>
                  <p className="text-lg">Your nickname:</p>
                  <p className="rounded-md bg-white/10 px-4 py-3 text-center text-2xl font-bold">{nameInput}</p>
                  <button
                    type="button"
                    disabled={view.rerolls >= MAX_REROLLS || busy}
                    onClick={() => send({ t: "player:checkPin", pin })}
                    className="text-sm underline disabled:opacity-40"
                  >
                    Spin again ({MAX_REROLLS - view.rerolls} left)
                  </button>
                </>
              ) : (
                <>
                  <label htmlFor="nick" className="sr-only">
                    Nickname
                  </label>
                  <input
                    id="nick"
                    autoFocus
                    autoComplete="off"
                    maxLength={16}
                    placeholder="Nickname"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    className="rounded-md px-4 py-3 text-center text-2xl font-bold text-black"
                  />
                </>
              )}
              <BigButton disabled={busy}>OK, go!</BigButton>
            </form>
            <ErrorText error={error} />
          </Centered>
        )}

        {view.k === "lobby" && (
          <Centered>
            <p className="text-3xl font-extrabold">You&apos;re in!</p>
            <p className="mt-2 text-lg">See your name on screen?</p>
            <p className="mt-8 rounded-md bg-white/10 px-4 py-2 text-xl font-bold">{name}</p>
          </Centered>
        )}

        {view.k === "intro" && (
          <Centered>
            <p className="text-2xl font-bold">Get ready...</p>
            <p className="mt-2 opacity-80">Look at the big screen</p>
          </Centered>
        )}

        {view.k === "open" && (
          <div className={cn("grid flex-1 gap-2 p-2", view.nChoices > 2 ? "grid-cols-2 grid-rows-2" : "grid-cols-1 grid-rows-2 sm:grid-cols-2 sm:grid-rows-1")}>
            {SHAPES.slice(0, view.nChoices).map((s, i) => (
              <button
                key={s.shape}
                aria-label={view.type === "tf" ? (i === 0 ? "True" : "False") : s.label}
                onPointerDown={() => answer(i)}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && answer(i)}
                className={cn(s.bg, "flex min-h-[20vh] items-center justify-center rounded-md shadow-[inset_0_-6px_0_rgba(0,0,0,0.25)] active:translate-y-1 active:shadow-none")}
              >
                <ShapeIcon shape={s.shape} className="h-1/3 max-h-28 w-1/3 max-w-28 text-white drop-shadow" />
              </button>
            ))}
          </div>
        )}

        {view.k === "answered" && (
          <Centered>
            {choiceRef.current !== null && (
              <ShapeIcon shape={SHAPES[choiceRef.current].shape} className={cn("mb-4 h-16 w-16", SHAPES[choiceRef.current].text)} />
            )}
            <p className="text-2xl font-bold">Answer locked in</p>
            <p className="mt-2 opacity-80">Waiting for everyone else...</p>
          </Centered>
        )}

        {view.k === "result" && <Result r={view.r} />}

        {view.k === "final" && (
          <Centered>
            <p className="text-lg opacity-80">You finished</p>
            <p className="my-2 text-6xl font-extrabold">{ordinal(view.rank)}</p>
            <p className="text-lg">
              of {view.count} with <strong>{view.score.toLocaleString()}</strong> points
            </p>
            {view.rank <= 3 && <p className="mt-6 text-2xl font-bold">{["🥇", "🥈", "🥉"][view.rank - 1]} On the podium!</p>}
          </Centered>
        )}

        {(view.k === "ended" || view.k === "kicked") && (
          <Centered>
            <p className="text-2xl font-bold">{view.k === "kicked" ? "The host removed you from the game." : "This game has ended."}</p>
            <button onClick={leave} className="mt-6 underline">
              Join another game
            </button>
          </Centered>
        )}
      </main>

      {name && view.k !== "pin" && view.k !== "name" && (
        <div className="flex items-center justify-between bg-black/30 px-4 py-2 text-sm font-semibold">
          <span className="truncate">{name}</span>
          <span className="rounded bg-black/40 px-2 py-0.5 tabular-nums">{score.toLocaleString()}</span>
        </div>
      )}
    </div>
  );
}

function Result({ r }: { r: ResultMsg }) {
  const good = r.correct;
  return (
    <div className={cn("flex flex-1 flex-col items-center justify-center px-6 text-center", good ? "bg-quiz-green" : "bg-quiz-red")}>
      <p className="text-4xl font-extrabold">{!r.answered ? "Time's up!" : good ? "Correct!" : "Incorrect"}</p>
      {good ? (
        <p className="mt-4 rounded-md bg-black/25 px-4 py-2 text-2xl font-bold">+{r.points.toLocaleString()}</p>
      ) : null}
      {r.streak >= 2 && <p className="mt-3 text-lg font-semibold">🔥 Answer streak: {r.streak}</p>}
      <p className="mt-8 text-lg">
        You&apos;re in <strong>{ordinal(r.rank)}</strong> place
      </p>
      {r.behind && (
        <p className="mt-1 opacity-90">
          {r.behind.gap === 0 ? `Tied with ${r.behind.name}` : `${r.behind.gap.toLocaleString()} points behind ${r.behind.name}`}
        </p>
      )}
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center px-6 py-10 text-center">{children}</div>;
}

function BigButton({ children, disabled }: { children: React.ReactNode; disabled?: boolean }) {
  return (
    <button
      type="submit"
      disabled={disabled}
      className="rounded-md bg-white px-4 py-3 text-xl font-bold text-[#002855] shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] disabled:opacity-50"
    >
      {children}
    </button>
  );
}

function ErrorText({ error }: { error: string | null }) {
  if (!error) return null;
  return (
    <p className="mt-4 rounded-md bg-quiz-red px-3 py-2 text-sm font-semibold" role="alert">
      {error}
    </p>
  );
}
