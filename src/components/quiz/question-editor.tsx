"use client";

import React, { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { SHAPES } from "@/lib/quiz/shapes";
import ShapeIcon from "@/components/quiz/shape-icon";
import { MAX_ANSWER_LEN, MAX_QUESTION_LEN, TIME_OPTIONS } from "../../../game-server/quiz-rules";
import type { DraftQuestion, PointsMode, QuestionType } from "../../../game-server/protocol";

const POINTS: { value: PointsMode; label: string }[] = [
  { value: "standard", label: "Standard" },
  { value: "double", label: "Double" },
  { value: "none", label: "No points" },
];

export default function QuestionEditor({
  question: q,
  index,
  problems,
  onChange,
}: {
  question: DraftQuestion;
  index: number;
  problems: string[];
  onChange: (q: DraftQuestion) => void;
}) {
  const set = (patch: Partial<DraftQuestion>) => onChange({ ...q, ...patch });
  // The answer indexes mean different things per type, so switching clears them.
  const setType = (type: QuestionType) => type !== q.type && set({ type, correct: [] });
  const toggleCorrect = (i: number) =>
    set({ correct: q.correct.includes(i) ? q.correct.filter((c) => c !== i) : [...q.correct, i].sort() });

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
        <span className="text-sm font-semibold uppercase tracking-wide opacity-70">Question {index + 1}</span>
        <div className="flex rounded-md bg-black/25 p-1" role="radiogroup" aria-label="Question type">
          {(
            [
              ["quiz", "Quiz"],
              ["tf", "True / False"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={q.type === value}
              onClick={() => setType(value)}
              className={cn("rounded px-3 py-1 text-sm font-semibold", q.type === value ? "bg-white text-[#002855]" : "hover:bg-white/10")}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm">
          Time
          <select value={q.time} onChange={(e) => set({ time: Number(e.target.value) })} className="rounded-md px-2 py-1 text-black">
            {TIME_OPTIONS.map((t) => (
              <option key={t} value={t}>
                {t} s
              </option>
            ))}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          Points
          <select value={q.points} onChange={(e) => set({ points: e.target.value as PointsMode })} className="rounded-md px-2 py-1 text-black">
            {POINTS.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div>
        <textarea
          value={q.text}
          maxLength={MAX_QUESTION_LEN}
          rows={2}
          placeholder="Type your question"
          aria-label="Question text"
          onChange={(e) => set({ text: e.target.value.replace(/[\r\n]+/g, " ") })}
          className="w-full resize-none rounded-md bg-white px-5 py-4 text-center text-2xl font-bold text-[#002855] shadow placeholder:text-[#002855]/40"
        />
        <Counter n={q.text.length} max={MAX_QUESTION_LEN} />
      </div>

      <ImageField key={index} value={q.image} onChange={(image) => set({ image })} />

      {q.type === "quiz" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {SHAPES.map((s, i) => (
            <AnswerTile key={s.shape} slot={i} correct={q.correct.includes(i)} onToggle={() => toggleCorrect(i)} toggleLabel="Mark as a correct answer">
              <input
                value={q.answers[i] ?? ""}
                maxLength={MAX_ANSWER_LEN}
                placeholder={i < 2 ? `Answer ${i + 1}` : `Answer ${i + 1} (optional)`}
                aria-label={`Answer ${i + 1} (${s.label})`}
                onChange={(e) => set({ answers: q.answers.map((a, j) => (j === i ? e.target.value : a)) })}
                className="min-w-0 flex-1 border-b border-white/30 bg-transparent py-1 text-lg font-bold text-white outline-none placeholder:text-white/60 focus:border-white"
              />
            </AnswerTile>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {["True", "False"].map((label, i) => (
            <AnswerTile key={label} slot={i} correct={q.correct[0] === i} onToggle={() => set({ correct: [i] })} toggleLabel={`${label} is correct`}>
              <span className="flex-1 py-1 text-lg font-bold">{label}</span>
            </AnswerTile>
          ))}
        </div>
      )}
      <p className="-mt-2 text-sm opacity-70">
        {q.type === "quiz" ? "Tick every correct answer. Picking any of them scores." : "Tick the correct answer."}
      </p>

      {problems.length > 0 && (
        <ul className="space-y-1 rounded-md bg-black/25 p-3 text-sm text-quiz-yellow">
          {problems.map((p, i) => (
            <li key={i}>⚠ {p}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function AnswerTile({
  slot,
  correct,
  onToggle,
  toggleLabel,
  children,
}: {
  slot: number;
  correct: boolean;
  onToggle: () => void;
  toggleLabel: string;
  children: React.ReactNode;
}) {
  const s = SHAPES[slot];
  return (
    <div className={cn(s.bg, "flex items-center gap-3 rounded-md px-4 py-3 shadow-[inset_0_-6px_0_rgba(0,0,0,0.25)]")}>
      <ShapeIcon shape={s.shape} className="h-8 w-8 shrink-0" />
      {children}
      <button
        type="button"
        onClick={onToggle}
        aria-pressed={correct}
        aria-label={toggleLabel}
        title={toggleLabel}
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white transition-colors",
          correct ? "bg-white text-[#002855]" : "text-transparent hover:text-white/60",
        )}
      >
        <Check className="h-5 w-5" strokeWidth={3} />
      </button>
    </div>
  );
}

function ImageField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [broken, setBroken] = useState(false);
  // Same rule the server applies; only preview what would be accepted.
  const previewable = /^https:\/\/\S+$/i.test(value) || /^\/quiz\/img\/[\w./-]+$/.test(value);
  return (
    <div className="flex flex-col gap-2">
      <input
        value={value}
        placeholder="Image URL (optional): https://... or /quiz/img/..."
        aria-label="Image URL"
        onChange={(e) => {
          setBroken(false);
          onChange(e.target.value.trim());
        }}
        className="rounded-md bg-white/10 px-3 py-2 text-sm outline-none placeholder:text-white/50 focus:bg-white/15"
      />
      {value && previewable && !broken && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" onError={() => setBroken(true)} className="max-h-48 self-center rounded-md object-contain shadow" />
      )}
      {value && previewable && broken && <p className="text-sm text-quiz-yellow">Couldn&apos;t load that image. Check the URL.</p>}
    </div>
  );
}

function Counter({ n, max }: { n: number; max: number }) {
  return <p className={cn("mt-1 text-right text-xs tabular-nums", n >= max ? "text-quiz-yellow" : "opacity-60")}>{`${n}/${max}`}</p>;
}
