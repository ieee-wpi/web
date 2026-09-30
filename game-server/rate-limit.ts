// Token bucket: `capacity` burst, refilled at `perSecond`.
export class TokenBucket {
  private tokens: number;
  private last = Date.now();
  constructor(private readonly capacity: number, private readonly perSecond: number) {
    this.tokens = capacity;
  }
  take(n = 1) {
    const now = Date.now();
    this.tokens = Math.min(this.capacity, this.tokens + ((now - this.last) / 1000) * this.perSecond);
    this.last = now;
    if (this.tokens < n) return false;
    this.tokens -= n;
    return true;
  }
}

// One bucket per key (e.g. client IP). Idle buckets are dropped by sweep().
export class KeyedLimiter {
  private buckets = new Map<string, { bucket: TokenBucket; seen: number }>();
  constructor(private readonly capacity: number, private readonly perSecond: number) {}
  take(key: string) {
    let entry = this.buckets.get(key);
    if (!entry) {
      entry = { bucket: new TokenBucket(this.capacity, this.perSecond), seen: 0 };
      this.buckets.set(key, entry);
    }
    entry.seen = Date.now();
    return entry.bucket.take();
  }
  sweep(maxIdleMs = 10 * 60_000) {
    const cutoff = Date.now() - maxIdleMs;
    for (const [key, entry] of this.buckets) if (entry.seen < cutoff) this.buckets.delete(key);
  }
}
