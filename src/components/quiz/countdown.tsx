"use client";

import React from "react";
import { cn } from "@/lib/utils";
import { useCountdown } from "@/lib/quiz/use-quiz-socket";

// Circular countdown for the projector and a thin bar for phones.
export function CountdownRing({ deadline, totalMs, className }: { deadline: number; totalMs: number; className?: string }) {
  const remaining = useCountdown(deadline);
  const frac = totalMs > 0 ? remaining / totalMs : 0;
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className={cn("relative aspect-square", className)} role="timer" aria-label={`${Math.ceil(remaining / 1000)} seconds left`}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="#002855" stroke="rgba(255,255,255,0.15)" strokeWidth="8" />
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke={frac < 0.25 ? "#E21B3C" : "#ffffff"}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - frac)}
          style={{ transition: "stroke-dashoffset 100ms linear" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[clamp(1.5rem,4vw,4rem)] font-bold tabular-nums text-white">
        {Math.ceil(remaining / 1000)}
      </span>
    </div>
  );
}

export function CountdownBar({ deadline, totalMs }: { deadline: number; totalMs: number }) {
  const remaining = useCountdown(deadline);
  const frac = totalMs > 0 ? remaining / totalMs : 0;
  return (
    <div className="h-2 w-full bg-white/20" role="timer" aria-label={`${Math.ceil(remaining / 1000)} seconds left`}>
      <div className="h-full bg-white" style={{ width: `${frac * 100}%`, transition: "width 100ms linear" }} />
    </div>
  );
}
