// Host-only audio. Phones stay silent.
//
// Music loops are optional files in public/quiz/sfx/ (CC0 only, see CREDITS.md
// there); a missing file just means no music. Short effects are synthesized
// with Web Audio, so they need no assets and have no licensing questions.

type Track = "lobby" | "question";
const TRACKS: Record<Track, string> = {
  lobby: "/quiz/sfx/lobby.mp3",
  question: "/quiz/sfx/question.mp3",
};

class QuizSound {
  private ctx: AudioContext | null = null;
  private audio = new Map<Track, HTMLAudioElement>();
  private current: Track | null = null;
  muted = false;

  constructor() {
    if (typeof window === "undefined") return;
    try {
      this.muted = localStorage.getItem("quiz:muted") === "1";
    } catch {
      // storage blocked
    }
  }

  // Must run inside a user gesture (a click) to satisfy autoplay policies.
  unlock() {
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = Ctx ? new Ctx() : null;
    }
    void this.ctx?.resume();
    for (const [name, url] of Object.entries(TRACKS) as [Track, string][]) {
      if (this.audio.has(name)) continue;
      const el = new Audio(url);
      el.loop = true;
      el.preload = "auto";
      el.volume = 0.5;
      this.audio.set(name, el);
    }
    return this.ctx?.state === "running";
  }

  get unlocked() {
    return this.ctx?.state === "running";
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    try {
      localStorage.setItem("quiz:muted", muted ? "1" : "0");
    } catch {
      // ignore
    }
    if (muted) this.audio.forEach((el) => el.pause());
    else if (this.current) this.music(this.current);
  }

  music(track: Track | null) {
    if (this.current !== track) {
      this.audio.forEach((el, name) => {
        if (name !== track) {
          el.pause();
          el.currentTime = 0;
        }
      });
    }
    this.current = track;
    if (!track || this.muted) return;
    this.audio.get(track)?.play().catch(() => {
      // Missing file or autoplay blocked; the game works without music.
    });
  }

  private tone(freq: number, start: number, dur: number, type: OscillatorType = "sine", gain = 0.2) {
    const ctx = this.ctx;
    if (!ctx || this.muted) return;
    const t = ctx.currentTime + start;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  join() {
    this.tone(880, 0, 0.12, "triangle", 0.12);
  }
  tick(final = false) {
    this.tone(final ? 1320 : 990, 0, 0.08, "square", 0.08);
  }
  getReady() {
    [523, 659, 784].forEach((f, i) => this.tone(f, i * 0.15, 0.25, "triangle"));
  }
  reveal() {
    [392, 523, 659, 784].forEach((f, i) => this.tone(f, i * 0.07, 0.4, "triangle", 0.15));
  }
  drumroll() {
    for (let i = 0; i < 14; i++) this.tone(110 + (i % 2) * 10, i * 0.07, 0.06, "square", 0.05);
  }
  fanfare() {
    const notes = [523, 523, 523, 698, 880, 784, 1047];
    const at = [0, 0.15, 0.3, 0.45, 0.8, 1.0, 1.2];
    notes.forEach((f, i) => this.tone(f, at[i], i === notes.length - 1 ? 0.9 : 0.2, "sawtooth", 0.1));
  }
}

let instance: QuizSound | null = null;
export function quizSound() {
  instance ??= new QuizSound();
  return instance;
}
