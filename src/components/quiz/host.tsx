"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Copy, Maximize, Pencil, Plus, Trash2, Volume2, VolumeX } from "lucide-react";
import { cn } from "@/lib/utils";
import { quizHttpUrl, useQuizSocket } from "@/lib/quiz/use-quiz-socket";
import { quizSound } from "@/components/quiz/sound";
import QuizBuilder, { type BuilderSource } from "@/components/quiz/builder";
import { builderApi } from "@/lib/quiz/builder-api";
import { Intro, Lobby, Podium, QuestionView, Scoreboard } from "@/components/quiz/host-screens";
import type { ClientMessage, HostMessage, HostSettings, QuizProblem, QuizSummary, ServerMessage } from "../../../game-server/protocol";

type Msg<T extends HostMessage["t"]> = Extract<HostMessage, { t: T }>;
type GameInfo = Msg<"host:created">;
// The current game screen, plus the local deadline for timed phases.
type Screen =
  | Msg<"lobby">
  | (Msg<"intro"> & { deadline: number })
  | (Msg<"open"> & { deadline: number })
  | Msg<"reveal">
  | Msg<"scoreboard">
  | Msg<"podium">
  | Msg<"ended">;

const SOURCE_LABEL: Record<QuizSummary["source"], string> = { sheet: "Google Sheet", local: "Local file", saved: "Built here" };

const PW_KEY = "quiz:hostpw";
const SESSION_KEY = "quiz:host";

function load<T>(key: string): T | null {
  try {
    return JSON.parse(sessionStorage.getItem(key) ?? "null");
  } catch {
    return null;
  }
}
function save(key: string, value: unknown) {
  try {
    if (value === null) sessionStorage.removeItem(key);
    else sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage blocked: a refresh will need the password again
  }
}

export default function Host() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [validation, setValidation] = useState<{ quizId: string; title: string; count: number; problems: QuizProblem[] } | null>(null);
  const [settings, setSettings] = useState<HostSettings>({ nameGenerator: false, autoplay: false });
  const [game, setGame] = useState<GameInfo | null>(null);
  const [screen, setScreen] = useState<Screen | null>(null);
  const [progress, setProgress] = useState({ answered: 0, total: 0 });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [muted, setMuted] = useState(false);
  const [soundReady, setSoundReady] = useState(false);
  // Open while the quiz builder is showing; `source` says what it edits.
  const [building, setBuilding] = useState<{ source: BuilderSource } | null>(null);
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const playerCount = useRef(0);

  useEffect(() => {
    setMuted(quizSound().muted);
    const pw = load<string>(PW_KEY);
    if (pw) setPassword(pw);
  }, []);

  const onOpen = useCallback((send: (m: ClientMessage) => void) => {
    const session = load<{ pin: string; hostToken: string }>(SESSION_KEY);
    const pw = load<string>(PW_KEY);
    if (session) send({ t: "host:resume", pin: session.pin, hostToken: session.hostToken });
    else if (pw) send({ t: "host:listQuizzes", password: pw });
  }, []);

  const onMessage = useCallback((m: ServerMessage) => {
    setBusy(false);
    const sound = quizSound();
    switch (m.t) {
      case "host:quizzes":
        setAuthed(true);
        setError(null);
        setQuizzes(m.quizzes);
        break;
      case "host:validated":
        setValidation({ quizId: m.quizId, title: m.title, count: m.count, problems: m.problems });
        break;
      case "host:created":
        setAuthed(true);
        setError(null);
        setGame(m);
        save(SESSION_KEY, { pin: m.pin, hostToken: m.hostToken });
        // Warm the browser cache so images appear instantly during questions.
        for (const src of m.images) new Image().src = src;
        break;
      case "lobby":
        if (m.players.length > playerCount.current) sound.join();
        playerCount.current = m.players.length;
        sound.music("lobby");
        setScreen(m);
        break;
      case "intro":
        sound.music(null);
        sound.getReady();
        setScreen({ ...m, deadline: performance.now() + m.introMs });
        break;
      case "open":
        sound.music("question");
        setScreen({ ...m, deadline: performance.now() + m.remainingMs });
        break;
      case "progress":
        setProgress({ answered: m.answered, total: m.total });
        break;
      case "reveal":
        sound.music(null);
        sound.reveal();
        setScreen(m);
        break;
      case "scoreboard":
        sound.music("lobby");
        setScreen(m);
        break;
      case "podium":
        setScreen(m);
        break;
      case "ended":
        sound.music(null);
        save(SESSION_KEY, null);
        setScreen(m);
        break;
      case "error":
        if (m.code === "BAD_PASSWORD") {
          save(PW_KEY, null);
          setAuthed(false);
        }
        if (m.code === "BAD_TOKEN") {
          // The game this tab was hosting is gone (server restarted or expired).
          save(SESSION_KEY, null);
          setGame(null);
          setScreen(null);
        }
        setError(m.message);
        break;
    }
  }, []);

  const { status, send } = useQuizSocket({ onMessage, onOpen });

  // After a refresh the browser blocks audio until the next click anywhere.
  useEffect(() => {
    const unlock = () => setSoundReady(quizSound().unlock());
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  const advance = useCallback(() => {
    if (!screen) return;
    if (screen.t === "lobby") send({ t: "host:start" });
    else if (screen.t === "open") send({ t: "host:skip" });
    else if (screen.t !== "podium" && screen.t !== "ended") send({ t: "host:next" });
  }, [screen, send]);

  const toggleMute = useCallback(() => {
    const next = !quizSound().muted;
    quizSound().setMuted(next);
    setMuted(next);
  }, []);

  // Presentation clickers send arrow keys / PageDown. Off in the builder,
  // where no game is running and letters belong to the form.
  useEffect(() => {
    if (building) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === " " || e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        advance();
      } else if (e.key === "s" || e.key === "S") send({ t: "host:skip" });
      else if (e.key === "m" || e.key === "M") toggleMute();
      else if (e.key === "f" || e.key === "F") toggleFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [advance, send, toggleMute, building]);

  // ---------- pre-game ----------

  const login = (e: React.FormEvent) => {
    e.preventDefault();
    save(PW_KEY, password);
    setError(null);
    if (send({ t: "host:listQuizzes", password })) setBusy(true);
  };

  const validate = (quizId: string) => {
    setSelected(quizId);
    setValidation(null);
    if (send({ t: "host:validate", password, quizId })) setBusy(true);
  };

  const create = () => {
    if (!selected) return;
    setSoundReady(quizSound().unlock()); // this click is the user gesture browsers require for audio
    playerCount.current = 0;
    if (send({ t: "host:create", password, quizId: selected, settings })) setBusy(true);
  };

  const closeBuilder = (selectId?: string) => {
    setBuilding(null);
    send({ t: "host:listQuizzes", password });
    if (selectId) validate(selectId);
  };

  const deleteQuiz = async (quizId: string) => {
    setPendingDelete(null);
    try {
      await builderApi(password).remove(quizId);
    } catch (e) {
      setError((e as Error).message);
    }
    if (selected === quizId) {
      setSelected(null);
      setValidation(null);
    }
    send({ t: "host:listQuizzes", password });
  };

  const newGame = () => {
    save(SESSION_KEY, null);
    setGame(null);
    setScreen(null);
    setValidation(null);
    send({ t: "host:listQuizzes", password });
  };

  const inGame = game && screen && screen.t !== "ended";
  const nextLabel =
    screen?.t === "intro" ? "Show answers" : screen?.t === "open" ? "Skip" : screen?.t === "reveal" ? (game && screen.q >= game.count - 1 ? "Podium" : "Scoreboard") : screen?.t === "scoreboard" ? "Next question" : null;

  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden bg-[#002855] text-white">
      <header className="flex items-center gap-4 bg-black/30 px-4 py-2 text-sm">
        <span className="font-bold">IEEE Live Quiz</span>
        {game && inGame && screen.t !== "lobby" && (
          <span className="opacity-80">
            PIN <strong className="tabular-nums">{game.pin}</strong> · {game.title}
          </span>
        )}
        {status !== "open" && (
          <span className="rounded bg-amber-500 px-2 py-0.5 font-semibold text-black">{status === "offline" ? "Game server unreachable" : "Reconnecting..."}</span>
        )}
        {error && (
          <button onClick={() => setError(null)} className="rounded bg-quiz-red px-2 py-0.5 font-semibold" title="Dismiss">
            {error} ✕
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {!soundReady && !muted && game && <span className="opacity-70">Click anywhere to enable sound</span>}
          <IconButton label={muted ? "Unmute (M)" : "Mute (M)"} onClick={toggleMute}>
            {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </IconButton>
          <IconButton label="Fullscreen (F)" onClick={toggleFullscreen}>
            <Maximize className="h-5 w-5" />
          </IconButton>
          {nextLabel && (
            <button onClick={advance} className="rounded-md bg-white px-4 py-1.5 font-bold text-[#002855]" title="Space / →">
              {nextLabel} →
            </button>
          )}
        </div>
      </header>

      {!authed && !game && (
        <Panel>
          <h1 className="mb-6 text-3xl font-extrabold">Host a quiz</h1>
          <form onSubmit={login} className="flex w-full max-w-sm flex-col gap-3">
            <label htmlFor="pw" className="text-sm opacity-80">
              Host password
            </label>
            <input
              id="pw"
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md px-4 py-3 text-lg text-black"
            />
            <button disabled={busy || status !== "open" || !password} className="rounded-md bg-white px-4 py-3 text-lg font-bold text-[#002855] disabled:opacity-50">
              Continue
            </button>
          </form>
        </Panel>
      )}

      {authed && !game && building && <QuizBuilder password={password} source={building.source} onClose={closeBuilder} />}

      {authed && !game && !building && (
        <Panel>
          <div className="mb-6 flex w-full max-w-2xl flex-wrap items-center justify-between gap-3">
            <h1 className="text-3xl font-extrabold">Choose a quiz</h1>
            <button onClick={() => setBuilding({ source: null })} className="flex items-center gap-1 rounded-md bg-white/15 px-4 py-2 font-semibold hover:bg-white/25">
              <Plus className="h-4 w-4" /> New quiz
            </button>
          </div>
          <div className="w-full max-w-2xl space-y-2">
            {quizzes.length === 0 && (
              <p className="opacity-80">No quizzes yet. Click New quiz to build one, list one in the Index tab of the quiz spreadsheet, or add a CSV to game-server/quizzes/.</p>
            )}
            {quizzes.map((q) => (
              <React.Fragment key={q.id}>
                <div className={cn("flex w-full items-center gap-1 rounded-md pr-2", selected === q.id ? "bg-white text-[#002855]" : "bg-white/10 hover:bg-white/20")}>
                  <button onClick={() => validate(q.id)} className="flex min-w-0 flex-1 items-center justify-between gap-3 px-4 py-3 text-left text-lg">
                    <span className="truncate font-semibold">{q.title}</span>
                    <span className="shrink-0 text-sm opacity-70">{SOURCE_LABEL[q.source]}</span>
                  </button>
                  {q.source === "saved" ? (
                    <>
                      <IconButton label="Edit" onClick={() => setBuilding({ source: { id: q.id, duplicate: false } })}>
                        <Pencil className="h-5 w-5" />
                      </IconButton>
                      <IconButton label="Delete" onClick={() => setPendingDelete(q.id)}>
                        <Trash2 className="h-5 w-5" />
                      </IconButton>
                    </>
                  ) : (
                    <IconButton label="Copy into the builder to edit" onClick={() => setBuilding({ source: { id: q.id, duplicate: true } })}>
                      <Copy className="h-5 w-5" />
                    </IconButton>
                  )}
                </div>
                {pendingDelete === q.id && (
                  <div className="flex flex-wrap items-center gap-3 rounded-md bg-quiz-red px-4 py-2 text-sm font-semibold">
                    <span className="flex-1">Delete &ldquo;{q.title}&rdquo;? It can only be recovered from the server&apos;s trash folder.</span>
                    <button onClick={() => void deleteQuiz(q.id)} className="rounded bg-white px-3 py-1 font-bold text-quiz-red">
                      Delete
                    </button>
                    <button onClick={() => setPendingDelete(null)} className="rounded bg-black/20 px-3 py-1 hover:bg-black/30">
                      Cancel
                    </button>
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {selected && validation?.quizId === selected && (
            <div className="mt-6 w-full max-w-2xl rounded-md bg-black/25 p-4">
              {validation.problems.length === 0 ? (
                <p className="font-semibold">
                  ✓ &ldquo;{validation.title}&rdquo;: {validation.count} questions, ready to play.
                </p>
              ) : (
                <>
                  <p className="mb-2 font-semibold text-quiz-yellow">
                    {validation.quizId.startsWith("saved:")
                      ? "Fix these in the builder, then click the quiz again:"
                      : "Fix these rows in the sheet, then click the quiz again:"}
                  </p>
                  <ul className="max-h-48 space-y-1 overflow-y-auto text-sm">
                    {validation.problems.map((p, i) => (
                      <li key={i}>
                        {/* Builder quizzes: row 1 is the title, row 2 the header, so question N is row N + 2. */}
                        {!validation.quizId.startsWith("saved:") ? `Row ${p.row}: ` : p.row > 2 ? `Question ${p.row - 2}: ` : ""}
                        {p.message}
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          <div className="mt-6 flex w-full max-w-2xl flex-wrap gap-6">
            <Toggle checked={settings.nameGenerator} onChange={(v) => setSettings((s) => ({ ...s, nameGenerator: v }))}>
              Nickname generator (players can&apos;t type their own names)
            </Toggle>
            <Toggle checked={settings.autoplay} onChange={(v) => setSettings((s) => ({ ...s, autoplay: v }))}>
              Autoplay (advance after 5 s)
            </Toggle>
          </div>

          <button
            onClick={create}
            disabled={busy || !validation || validation.quizId !== selected || validation.problems.length > 0}
            className="mt-8 rounded-md bg-white px-8 py-3 text-xl font-bold text-[#002855] disabled:opacity-40"
          >
            Create game
          </button>

          <PastResults password={password} />
        </Panel>
      )}

      {game && screen?.t === "lobby" && (
        <Lobby
          pin={game.pin}
          players={screen.players}
          locked={screen.locked}
          onKick={(playerId) => send({ t: "host:kick", playerId })}
          onLock={(locked) => send({ t: "host:lock", locked })}
          onStart={() => send({ t: "host:start" })}
        />
      )}
      {game && screen?.t === "intro" && <Intro msg={screen} deadline={screen.deadline} />}
      {game && screen?.t === "open" && (
        <QuestionView q={screen.q} text={screen.text} image={screen.image} choices={screen.choices} deadline={screen.deadline} timeMs={screen.timeMs} progress={progress} />
      )}
      {game && screen?.t === "reveal" && (
        <QuestionView q={screen.q} text={screen.text} image={screen.image} choices={screen.choices} reveal={{ correct: screen.correct, dist: screen.dist }} />
      )}
      {game && screen?.t === "scoreboard" && <Scoreboard msg={screen} />}
      {game && screen?.t === "podium" && (
        <Podium
          msg={screen}
          resultsHref={screen.resultsFile ? quizHttpUrl(`results/${screen.resultsFile}?key=${encodeURIComponent(game.hostToken)}`) : null}
          onEnd={() => send({ t: "host:end" })}
        />
      )}
      {game && screen?.t === "ended" && (
        <Panel>
          <p className="text-2xl font-bold">Game over. Thanks for playing!</p>
          <button onClick={newGame} className="mt-6 rounded-md bg-white px-6 py-3 font-bold text-[#002855]">
            Host another game
          </button>
        </Panel>
      )}
    </div>
  );
}

function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen();
  else void document.documentElement.requestFullscreen?.().catch(() => undefined);
}

function PastResults({ password }: { password: string }) {
  const [files, setFiles] = useState<string[] | null>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open || files) return;
    fetch(quizHttpUrl(`results?key=${encodeURIComponent(password)}`))
      .then((r) => (r.ok ? r.json() : []))
      .then(setFiles)
      .catch(() => setFiles([]));
  }, [open, files, password]);
  return (
    <details className="mt-10 w-full max-w-2xl" onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer opacity-80">Past results</summary>
      <ul className="mt-2 space-y-1 text-sm">
        {files === null && <li className="opacity-70">Loading...</li>}
        {files?.length === 0 && <li className="opacity-70">No saved results yet.</li>}
        {files?.map((f) => (
          <li key={f}>
            <a className="underline" href={quizHttpUrl(`results/${f}?key=${encodeURIComponent(password)}`)}>
              {f}
            </a>
          </li>
        ))}
      </ul>
    </details>
  );
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-1 flex-col items-center overflow-y-auto px-6 py-10">{children}</div>;
}

function Toggle({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-5 w-5" />
      <span>{children}</span>
    </label>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="rounded-md p-1.5 hover:bg-white/15">
      {children}
    </button>
  );
}
