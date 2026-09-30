"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { BuilderError, builderApi } from "@/lib/quiz/builder-api";
import QuestionEditor from "@/components/quiz/question-editor";
import { DEFAULT_TIME, MAX_QUESTIONS, MAX_TITLE_LEN } from "../../../game-server/quiz-rules";
import type { DraftProblem, DraftQuestion, QuizDraft } from "../../../game-server/protocol";

// What the builder opens on: null for a new quiz, a saved quiz to edit, or
// any quiz to copy into a new saved one.
export type BuilderSource = { id: string; duplicate: boolean } | null;

type Item = DraftQuestion & { key: number };
type StoredDraft = QuizDraft & { at: number };

const CHECK_DELAY_MS = 600;

let nextKey = 1;
const withKey = (q: DraftQuestion): Item => ({ ...q, key: nextKey++ });
const blank = (): DraftQuestion => ({ type: "quiz", text: "", image: "", time: DEFAULT_TIME, points: "standard", answers: ["", "", "", ""], correct: [] });
const toDraft = (title: string, items: Item[]): QuizDraft => ({ title, questions: items.map(({ key: _key, ...q }) => q) });

// Unsaved work survives a refresh or a closed tab, per quiz, in this browser only.
const draftKey = (id: string | null) => `quiz:draft:${id ?? "new"}`;
function loadStored(id: string | null): StoredDraft | null {
  try {
    return JSON.parse(localStorage.getItem(draftKey(id)) ?? "null");
  } catch {
    return null;
  }
}
function store(id: string | null, value: StoredDraft | null) {
  try {
    if (value) localStorage.setItem(draftKey(id), JSON.stringify(value));
    else localStorage.removeItem(draftKey(id));
  } catch {
    // storage blocked: drafts just aren't kept
  }
}

export default function QuizBuilder({ password, source, onClose }: { password: string; source: BuilderSource; onClose: (selectId?: string) => void }) {
  const api = useMemo(() => builderApi(password), [password]);
  const [loading, setLoading] = useState(true);
  const [id, setId] = useState<string | null>(null);
  const [etag, setEtag] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [items, setItems] = useState<Item[]>(() => [withKey(blank())]);
  const [sel, setSel] = useState(0);
  // JSON of the last saved (or loaded) draft; anything else is unsaved.
  const [snapshot, setSnapshot] = useState(() => JSON.stringify(toDraft("", [withKey(blank())])));
  const [problems, setProblems] = useState<DraftProblem[] | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [restore, setRestore] = useState<StoredDraft | null>(null);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const draft = useMemo(() => toDraft(title, items), [title, items]);
  const draftJson = useMemo(() => JSON.stringify(draft), [draft]);
  const dirty = draftJson !== snapshot;

  const apply = useCallback((d: QuizDraft) => {
    setTitle(d.title);
    setItems((d.questions.length ? d.questions : [blank()]).map(withKey));
    setSel(0);
  }, []);

  // ----- load -----
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let d: QuizDraft = toDraft("", [withKey(blank())]);
      let savedId: string | null = null;
      if (source) {
        try {
          const q = await api.get(source.id);
          if (source.duplicate) d = { title: `${q.title} (copy)`.slice(0, MAX_TITLE_LEN), questions: q.questions };
          else {
            d = { title: q.title, questions: q.questions };
            savedId = q.id;
            setEtag(q.etag);
          }
        } catch (e) {
          if (!cancelled) setError((e as Error).message);
        }
      }
      if (cancelled) return;
      apply(d);
      setId(savedId);
      // Compare against the list as apply() will show it (never empty).
      const shown = toDraft(d.title, (d.questions.length ? d.questions : [blank()]).map(withKey));
      setSnapshot(JSON.stringify(shown));
      if (!source?.duplicate) {
        const stored = loadStored(savedId);
        if (stored && JSON.stringify({ title: stored.title, questions: stored.questions }) !== JSON.stringify(shown)) setRestore(stored);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
    // Loads once per mount; the host remounts the builder for another quiz.
  }, []);

  // ----- keep a local draft of unsaved work -----
  useEffect(() => {
    if (loading || restore) return;
    store(id, dirty ? { ...draft, at: Date.now() } : null);
  }, [loading, restore, id, dirty, draft]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  // ----- live validation (the same checks as "Create game") -----
  const checkSeq = useRef(0);
  useEffect(() => {
    if (loading) return;
    const seq = ++checkSeq.current;
    setProblems(null);
    const t = setTimeout(() => {
      api
        .check(draft)
        .then((r) => seq === checkSeq.current && setProblems(r.problems))
        .catch((e: BuilderError) => seq === checkSeq.current && setError(e.message));
    }, CHECK_DELAY_MS);
    return () => clearTimeout(t);
  }, [api, draft, loading]);

  // ----- saving -----
  const save = async (etagOverride?: string): Promise<string | null> => {
    setSaving(true);
    setError(null);
    try {
      const r = id ? await api.save(id, draft, etagOverride ?? etag ?? "") : await api.create(draft);
      if (!id) store(null, null);
      setId(r.id);
      setEtag(r.etag);
      setProblems(r.problems);
      setSnapshot(draftJson);
      setConflict(false);
      return r.id;
    } catch (e) {
      if (e instanceof BuilderError && e.status === 409) setConflict(true);
      else setError((e as Error).message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const overwrite = async () => {
    if (!id) return;
    try {
      const current = await api.get(id);
      await save(current.etag ?? "");
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const loadTheirs = async () => {
    if (!id) return;
    try {
      const q = await api.get(id);
      apply(q);
      setEtag(q.etag);
      setSnapshot(JSON.stringify(toDraft(q.title, (q.questions.length ? q.questions : [blank()]).map(withKey))));
      setConflict(false);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const saveAndHost = async () => {
    const savedId = dirty || !id ? await save() : id;
    if (savedId) onClose(savedId);
  };

  const back = () => {
    if (dirty) setConfirmLeave(true);
    else onClose(id ?? undefined);
  };

  // ----- question list -----
  const update = (i: number, q: DraftQuestion) => setItems((xs) => xs.map((x, j) => (j === i ? { ...q, key: x.key } : x)));
  const add = () => {
    setItems((xs) => [...xs.slice(0, sel + 1), withKey(blank()), ...xs.slice(sel + 1)]);
    setSel((s) => Math.min(s + 1, items.length));
  };
  const duplicate = (i: number) => {
    setItems((xs) => [...xs.slice(0, i + 1), withKey(xs[i]), ...xs.slice(i + 1)]);
    setSel(i + 1);
  };
  const remove = (i: number) => {
    setItems((xs) => (xs.length === 1 ? [withKey(blank())] : xs.filter((_, j) => j !== i)));
    setSel((s) => Math.max(0, Math.min(s, items.length - 2)));
  };
  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    setItems((xs) => {
      const next = [...xs];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
    setSel(j);
  };

  const byQuestion = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const p of problems ?? []) if (p.question !== null) map.set(p.question, [...(map.get(p.question) ?? []), p.message]);
    return map;
  }, [problems]);
  const quizWide = (problems ?? []).filter((p) => p.question === null);
  const problemCount = problems?.length ?? 0;
  const current = items[sel];

  if (loading) return <div className="flex flex-1 items-center justify-center opacity-80">Loading quiz...</div>;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-black/20 px-4 py-3">
        <button onClick={back} className="flex items-center gap-1 rounded-md px-2 py-1.5 font-semibold hover:bg-white/15">
          <ArrowLeft className="h-4 w-4" /> Quizzes
        </button>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={MAX_TITLE_LEN}
          placeholder="Quiz title"
          aria-label="Quiz title"
          className="min-w-[12rem] flex-1 rounded-md bg-white/10 px-3 py-2 text-xl font-bold outline-none placeholder:text-white/50 focus:bg-white/15"
        />
        <span className="text-sm opacity-80" aria-live="polite">
          {saving ? "Saving..." : dirty ? "Unsaved changes" : id ? "Saved" : "Not saved yet"}
        </span>
        <button
          onClick={() => void save()}
          disabled={saving || (!dirty && !!id)}
          className="rounded-md bg-white/15 px-4 py-2 font-semibold hover:bg-white/25 disabled:opacity-40"
        >
          Save
        </button>
        <button
          onClick={() => void saveAndHost()}
          disabled={saving || problems === null || problemCount > 0}
          title={problemCount > 0 ? `Fix ${problemCount} problem(s) first` : undefined}
          className="rounded-md bg-white px-4 py-2 font-bold text-[#002855] disabled:opacity-40"
        >
          Save &amp; host →
        </button>
      </div>

      {error && (
        <Bar tone="error">
          <span className="flex-1">{error}</span>
          <BarButton onClick={() => setError(null)}>Dismiss</BarButton>
        </Bar>
      )}
      {conflict && (
        <Bar tone="warn">
          <span className="flex-1">Someone else saved this quiz after you opened it.</span>
          <BarButton onClick={() => void overwrite()}>Overwrite with mine</BarButton>
          <BarButton onClick={() => void loadTheirs()}>Load theirs</BarButton>
        </Bar>
      )}
      {restore && (
        <Bar tone="warn">
          <span className="flex-1">You have unsaved changes from {new Date(restore.at).toLocaleString()}. Restore them?</span>
          <BarButton
            onClick={() => {
              apply(restore);
              setRestore(null);
            }}
          >
            Restore
          </BarButton>
          <BarButton
            onClick={() => {
              store(id, null);
              setRestore(null);
            }}
          >
            Discard
          </BarButton>
        </Bar>
      )}
      {confirmLeave && (
        <Bar tone="warn">
          <span className="flex-1">Leave without saving? Your changes will be lost.</span>
          <BarButton
            onClick={() => {
              store(id, null);
              onClose(id ?? undefined);
            }}
          >
            Discard changes
          </BarButton>
          <BarButton onClick={() => setConfirmLeave(false)}>Keep editing</BarButton>
        </Bar>
      )}
      {quizWide.length > 0 && (
        <Bar tone="warn">
          <span className="flex-1">{quizWide.map((p) => p.message).join(" ")}</span>
        </Bar>
      )}

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside className="flex max-h-56 shrink-0 flex-col border-b border-white/10 bg-black/15 md:max-h-none md:w-72 md:border-b-0 md:border-r">
          <ol className="min-h-0 flex-1 space-y-1 overflow-y-auto p-2">
            {items.map((it, i) => (
              <li key={it.key}>
                <div className={cn("flex items-center gap-1 rounded-md pr-1", i === sel ? "bg-white text-[#002855]" : "hover:bg-white/10")}>
                  <button onClick={() => setSel(i)} className="flex min-w-0 flex-1 items-center gap-2 px-2 py-2 text-left">
                    <span className="w-6 shrink-0 text-right text-sm tabular-nums opacity-70">{i + 1}</span>
                    <span className={cn("truncate", !it.text && "italic opacity-60")}>{it.text || "Untitled question"}</span>
                    {byQuestion.has(i) && <span className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-quiz-red" title="Has problems" />}
                  </button>
                  {i === sel && (
                    <div className="flex shrink-0">
                      <RailButton label="Move up" onClick={() => move(i, -1)} disabled={i === 0}>
                        <ArrowUp className="h-4 w-4" />
                      </RailButton>
                      <RailButton label="Move down" onClick={() => move(i, 1)} disabled={i === items.length - 1}>
                        <ArrowDown className="h-4 w-4" />
                      </RailButton>
                      <RailButton label="Duplicate question" onClick={() => duplicate(i)} disabled={items.length >= MAX_QUESTIONS}>
                        <Copy className="h-4 w-4" />
                      </RailButton>
                      <RailButton label="Delete question" onClick={() => remove(i)}>
                        <Trash2 className="h-4 w-4" />
                      </RailButton>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ol>
          <button
            onClick={add}
            disabled={items.length >= MAX_QUESTIONS}
            className="m-2 flex items-center justify-center gap-1 rounded-md bg-white/15 px-3 py-2 font-semibold hover:bg-white/25 disabled:opacity-40"
          >
            <Plus className="h-4 w-4" /> Add question
          </button>
        </aside>

        <section className="min-w-0 flex-1 overflow-y-auto px-4 py-6 md:px-8">
          {current && <QuestionEditor question={current} index={sel} problems={byQuestion.get(sel) ?? []} onChange={(q) => update(sel, q)} />}
        </section>
      </div>
    </div>
  );
}

function Bar({ tone, children }: { tone: "error" | "warn"; children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-3 px-4 py-2 text-sm font-semibold", tone === "error" ? "bg-quiz-red" : "bg-quiz-yellow text-black")}>
      {children}
    </div>
  );
}

function BarButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} className="rounded bg-black/20 px-3 py-1 hover:bg-black/30">
      {children}
    </button>
  );
}

function RailButton({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button onClick={onClick} disabled={disabled} aria-label={label} title={label} className="rounded p-1 hover:bg-black/10 disabled:opacity-30">
      {children}
    </button>
  );
}
