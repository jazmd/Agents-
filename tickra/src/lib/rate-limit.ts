import 'server-only';

/**
 * Tiny in-process token bucket. Works on a single Vercel function instance
 * — good enough to block obvious abuse, not a security control. Swap for
 * Upstash Ratelimit once traffic grows.
 */

type Bucket = { tokens: number; updated: number };
const STORE = new Map<string, Bucket>();

export type LimitResult = { allowed: boolean; remaining: number; resetMs: number };

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): LimitResult {
  const now = Date.now();
  const refillPerMs = opts.limit / opts.windowMs;

  const prev = STORE.get(key);
  const elapsed = prev ? now - prev.updated : opts.windowMs;
  const refilled = Math.min(opts.limit, (prev?.tokens ?? opts.limit) + elapsed * refillPerMs);

  if (refilled < 1) {
    STORE.set(key, { tokens: refilled, updated: now });
    return { allowed: false, remaining: 0, resetMs: Math.ceil((1 - refilled) / refillPerMs) };
  }

  STORE.set(key, { tokens: refilled - 1, updated: now });
  return { allowed: true, remaining: Math.floor(refilled - 1), resetMs: 0 };
}

export function ipFrom(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}
