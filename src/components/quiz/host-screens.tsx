"use client";

import React, { useEffect, useRef, useState } from "react";
import { Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHAPES } from "@/lib/quiz/shapes";
import { useCountdown } from "@/lib/quiz/use-quiz-socket";
import ShapeIcon from "@/components/quiz/shape-icon";
import { CountdownRing } from "@/components/quiz/countdown";
import { quizSound } from "@/components/quiz/sound";
import type { HostMessage, PlayerInfo, Standing } from "../../../game-server/protocol";

type Msg<T extends HostMessage["t"]> = Extract<HostMessage, { t: T }>;

// ---------- lobby ----------

export function Lobby({
  pin,
  players,
  locked,
  onKick,
  onLock,
  onStart,
}: {
  pin: string;
  players: PlayerInfo[];
  locked: boolean;
  onKick: (id: string) => void;
  onLock: (locked: boolean) => void;
  onStart: () => void;
}) {
  const [qr, setQr] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    let cancelled = false;
    // Lazy-loaded so phones never download the QR library.
    import("qrcode")
      .then((QR) => QR.toString(`${window.location.origin}/quiz?pin=${pin}`, { type: "svg", margin: 1, errorCorrectionLevel: "M" }))
      .then((svg) => !cancelled && setQr(svg))
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [pin]);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex flex-wrap items-center justify-center gap-[3vw] bg-white px-6 py-4 text-[#002855]">
        <div className="text-center">
          <p className="text-[clamp(1rem,1.6vw,1.75rem)] font-semibold">
            Join at <strong>{origin.replace(/^https?:\/\//, "")}/quiz</strong>
          </p>
          <p className="text-[clamp(1rem,1.4vw,1.5rem)]">Game PIN:</p>
          <p className="text-[clamp(3rem,8vw,8rem)] font-black leading-none tracking-wider tabular-nums">
            {pin.slice(0, 3)} {pin.slice(3)}
          </p>
        </div>
        {qr && (
          <div
            className="aspect-square h-[clamp(8rem,18vh,14rem)] [&>svg]:h-full [&>svg]:w-full"
            role="img"
            aria-label="QR code to join"
            dangerouslySetInnerHTML={{ __html: qr }}
          />
        )}
      </div>

      <div className="flex items-center justify-between px-6 py-3">
        <p className="rounded-md bg-black/30 px-4 py-2 text-[clamp(1rem,1.6vw,1.75rem)] font-bold">
          {players.length} {players.length === 1 ? "player" : "players"}
        </p>
        <p className="text-[clamp(1.25rem,2.4vw,2.5rem)] font-extrabold">IEEE Live Quiz</p>
        <div className="flex gap-3">
          <button onClick={() => onLock(!locked)} className="rounded-md bg-white/15 px-4 py-2 font-semibold hover:bg-white/25">
            {locked ? "🔒 Locked" : "🔓 Lock"}
          </button>
          <button
            onClick={onStart}
            disabled={players.length === 0}
            className="rounded-md bg-white px-6 py-2 text-lg font-bold text-[#002855] disabled:opacity-40"
          >
            Start
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-wrap content-start justify-center gap-3 overflow-y-auto px-6 pb-6">
        {players.length === 0 && <p className="mt-10 text-xl opacity-70">Waiting for players...</p>}
        {players.map((p) => (
          <button
            key={p.id}
            onClick={() => onKick(p.id)}
            title="Click to remove"
            className={cn(
              "group animate-in zoom-in-50 rounded-md bg-white/15 px-4 py-2 text-[clamp(1rem,1.5vw,1.6rem)] font-bold duration-300 hover:bg-quiz-red hover:line-through",
              !p.connected && "opacity-50",
            )}
          >
            {p.name}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------- intro ----------

export function Intro({ msg, deadline }: { msg: Msg<"intro">; deadline: number }) {
  const remaining = useCountdown(deadline);
  const frac = msg.introMs > 0 ? remaining / Math.max(msg.introMs, 1) : 0;
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-[6vw] text-center">
      <p className="mb-4 text-[clamp(1rem,1.6vw,1.75rem)] font-semibold opacity-80">
        Question {msg.q + 1} of {msg.total}
        {msg.points === "double" && <span className="ml-3 rounded bg-quiz-yellow px-2 py-0.5 text-black">Double points!</span>}
      </p>
      <h2 className="rounded-md bg-white px-8 py-6 text-[clamp(1.75rem,4vw,4.5rem)] font-bold leading-tight text-[#002855] shadow-lg">{msg.text}</h2>
      <div className="mt-10 h-3 w-1/2 overflow-hidden rounded-full bg-white/20">
        <div className="h-full bg-white" style={{ width: `${Math.min(1, frac) * 100}%`, transition: "width 100ms linear" }} />
      </div>
    </div>
  );
}

// ---------- open question / reveal ----------

export function QuestionView({
  q,
  text,
  image,
  choices,
  deadline,
  timeMs,
  progress,
  reveal,
}: {
  q: number;
  text: string;
  image: string | null;
  choices: string[];
  deadline?: number;
  timeMs?: number;
  progress?: { answered: number; total: number };
  reveal?: { correct: number[]; dist: number[] };
}) {
  const remaining = useCountdown(deadline ?? null);
  const secs = Math.ceil(remaining / 1000);
  const lastTick = useRef<number | null>(null);

  useEffect(() => {
    if (reveal || deadline === undefined) return;
    if (secs <= 5 && secs >= 1 && lastTick.current !== secs) quizSound().tick(secs === 1);
    lastTick.current = secs;
  }, [secs, reveal, deadline]);

  return (
    <div className="flex flex-1 flex-col gap-[2vh] overflow-hidden p-[2vh]">
      <h2 key={q} className="rounded-md bg-white px-6 py-4 text-center text-[clamp(1.25rem,3vw,3.25rem)] font-bold leading-tight text-[#002855] shadow">
        {text}
      </h2>

      <div className="grid min-h-0 flex-1 grid-cols-[1fr_3fr_1fr] items-center gap-4">
        <div className="flex justify-center">
          {!reveal && deadline !== undefined && timeMs !== undefined && <CountdownRing deadline={deadline} totalMs={timeMs} className="w-[clamp(5rem,10vw,10rem)]" />}
        </div>
        <div className="flex h-full min-h-0 items-center justify-center">
          {reveal ? (
            <Distribution choices={choices} {...reveal} />
          ) : image ? (
            // Plain <img>: question images come from arbitrary URLs and only this one browser loads them.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={image} alt="" className="max-h-full max-w-full rounded-md object-contain shadow-lg" />
          ) : null}
        </div>
        <div className="flex justify-center">
          {!reveal && progress && (
            <div className="text-center">
              <p className="text-[clamp(2rem,5vw,5rem)] font-black tabular-nums leading-none">{progress.answered}</p>
              <p className="text-[clamp(0.9rem,1.3vw,1.4rem)] font-semibold opacity-80">Answers</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-[1.5vh]">
        {choices.map((c, i) => {
          const s = SHAPES[i];
          const isCorrect = reveal?.correct.includes(i);
          return (
            <div
              key={i}
              className={cn(
                s.bg,
                "flex min-h-[11vh] items-center gap-4 rounded-md px-5 py-3 text-[clamp(1.1rem,2.2vw,2.4rem)] font-bold shadow-[inset_0_-6px_0_rgba(0,0,0,0.25)] transition-opacity duration-500",
                reveal && !isCorrect && "opacity-30",
              )}
            >
              <ShapeIcon shape={s.shape} className="h-[clamp(1.5rem,3vw,3rem)] w-[clamp(1.5rem,3vw,3rem)] shrink-0" />
              <span className="flex-1 leading-tight">{c}</span>
              {reveal && (isCorrect ? <Check className="h-[clamp(1.5rem,3vw,3rem)] w-auto shrink-0" strokeWidth={4} /> : <X className="h-[clamp(1.5rem,3vw,3rem)] w-auto shrink-0" strokeWidth={4} />)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Distribution({ choices, correct, dist }: { choices: string[]; correct: number[]; dist: number[] }) {
  const max = Math.max(1, ...dist);
  const [grown, setGrown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setGrown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  return (
    <div className="flex h-full max-h-[40vh] items-end justify-center gap-[3vw]" aria-label="Answer distribution">
      {choices.map((_, i) => {
        const s = SHAPES[i];
        return (
          <div key={i} className="flex h-full w-[clamp(3rem,8vw,8rem)] flex-col items-center justify-end">
            <p className="mb-1 flex items-center gap-1 text-[clamp(1rem,2vw,2rem)] font-bold tabular-nums">
              {correct.includes(i) && <Check className="h-[1em] w-[1em]" strokeWidth={4} />}
              {dist[i]}
            </p>
            <div
              className={cn(s.bg, "w-full origin-bottom rounded-t-md transition-transform duration-700 ease-out", !correct.includes(i) && "opacity-50")}
              style={{ height: `${Math.max(4, (dist[i] / max) * 100)}%`, transform: grown ? "scaleY(1)" : "scaleY(0)" }}
            />
            <div className={cn(s.bg, "flex w-full justify-center rounded-b-md py-1")}>
              <ShapeIcon shape={s.shape} className="h-[clamp(1rem,2vw,2rem)] w-[clamp(1rem,2vw,2rem)]" />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ---------- scoreboard ----------

export function Scoreboard({ msg }: { msg: Msg<"scoreboard"> }) {
  return (
    <div className="flex flex-1 flex-col items-center px-[8vw] py-[4vh]">
      <h2 className="mb-[4vh] rounded-md bg-white px-8 py-3 text-[clamp(1.5rem,3vw,3rem)] font-extrabold text-[#002855]">Scoreboard</h2>
      <ol className="flex w-full max-w-5xl flex-col gap-[1.5vh]">
        {msg.top.map((s, i) => (
          <StandingRow key={s.id} s={s} index={i} />
        ))}
      </ol>
      <p className="mt-auto pt-6 opacity-70">
        After question {msg.q + 1} of {msg.total}
      </p>
    </div>
  );
}

function StandingRow({ s, index }: { s: Standing; index: number }) {
  return (
    <li
      className={cn(
        "flex items-center gap-4 rounded-md px-6 py-3 text-[clamp(1.1rem,2.2vw,2.4rem)] font-bold animate-in fade-in slide-in-from-bottom-4 fill-mode-both",
        index === 0 ? "bg-white text-[#002855]" : "bg-white/15",
      )}
      style={{ animationDelay: `${index * 120}ms`, animationDuration: "400ms" }}
    >
      <span className="w-[2ch] tabular-nums opacity-70">{s.rank}</span>
      <span className="flex-1 truncate">{s.name}</span>
      {s.streak >= 2 && <span className="text-[0.75em]">🔥{s.streak}</span>}
      {s.delta > 0 && <span className="text-[0.7em] opacity-70">+{s.delta.toLocaleString()}</span>}
      <span className="tabular-nums">{s.score.toLocaleString()}</span>
    </li>
  );
}

// ---------- podium ----------

export function Podium({ msg, resultsHref, onEnd }: { msg: Msg<"podium">; resultsHref: string | null; onEnd: () => void }) {
  // 0: drumroll, 1: 3rd, 2: 2nd, 3: 1st
  const [step, setStep] = useState(0);
  useEffect(() => {
    const s = quizSound();
    s.music(null);
    s.drumroll();
    const timers = [
      setTimeout(() => setStep(1), 1200),
      setTimeout(() => (s.drumroll(), setStep(2)), 2700),
      setTimeout(() => (s.fanfare(), setStep(3)), 4500),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const [first, second, third] = msg.top;
  const col = (s: Standing | undefined, place: 1 | 2 | 3, visible: boolean, height: string) => (
    <div className="flex w-[clamp(8rem,20vw,20rem)] flex-col items-center justify-end">
      <div className={cn("mb-3 text-center transition-all duration-700", visible && s ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0")}>
        <p className="text-[clamp(1.1rem,2.2vw,2.4rem)] font-extrabold leading-tight">{s?.name}</p>
        <p className="text-[clamp(0.9rem,1.5vw,1.6rem)] tabular-nums opacity-80">{s?.score.toLocaleString()} pts</p>
      </div>
      <div
        className={cn(
          "flex w-full items-start justify-center rounded-t-md pt-4 text-[clamp(2rem,5vw,5rem)] font-black shadow-lg",
          place === 1 ? "bg-quiz-yellow" : place === 2 ? "bg-slate-300 text-[#002855]" : "bg-amber-700",
        )}
        style={{ height }}
      >
        {place}
      </div>
    </div>
  );

  return (
    <div className="relative flex flex-1 flex-col items-center overflow-hidden px-6 pt-[4vh]">
      {step === 3 && <Confetti />}
      <h2 className="text-[clamp(1.5rem,3vw,3rem)] font-extrabold">🏆 Podium</h2>
      <div className="mt-auto flex items-end gap-[2vw]">
        {col(second, 2, step >= 2, "28vh")}
        {col(first, 1, step >= 3, "38vh")}
        {col(third, 3, step >= 1, "20vh")}
      </div>
      <div className="flex w-full items-center justify-between gap-4 bg-black/30 px-6 py-3">
        <p className="opacity-80">
          {msg.count} {msg.count === 1 ? "player" : "players"}
        </p>
        <div className="flex gap-3">
          {resultsHref && (
            <a href={resultsHref} className="rounded-md bg-white/15 px-4 py-2 font-semibold hover:bg-white/25">
              Download results (CSV)
            </a>
          )}
          <button onClick={onEnd} className="rounded-md bg-white px-4 py-2 font-bold text-[#002855]">
            End game
          </button>
        </div>
      </div>
    </div>
  );
}

function Confetti() {
  const colors = ["#E21B3C", "#1368CE", "#D89E00", "#26890C", "#ffffff"];
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {Array.from({ length: 80 }, (_, i) => (
        <span
          key={i}
          className="quiz-confetti absolute top-0 block h-3 w-2"
          style={{
            left: `${(i * 37) % 100}%`,
            backgroundColor: colors[i % colors.length],
            animationDelay: `${(i % 20) * 90}ms`,
            animationDuration: `${2200 + ((i * 53) % 1800)}ms`,
          }}
        />
      ))}
    </div>
  );
}
