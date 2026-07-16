// Minimal in-memory rate limiting. Single-process app (next start / next dev),
// so a Map is sufficient; entries are pruned as they expire.

const attempts = new Map<string, number[]>();
const failures = new Map<string, number[]>();

function prune(store: Map<string, number[]>, key: string, windowMs: number): number[] {
  const now = Date.now();
  const fresh = (store.get(key) ?? []).filter((t) => now - t < windowMs);
  if (fresh.length === 0) store.delete(key);
  else store.set(key, fresh);
  return fresh;
}

/** Attempt-based limit: returns false when the key has hit `max` in the window. */
export function rateLimit(key: string, max: number, windowMs: number): boolean {
  const fresh = prune(attempts, key, windowMs);
  if (fresh.length >= max) return false;
  fresh.push(Date.now());
  attempts.set(key, fresh);
  return true;
}

export const LOGIN_FAILURE_LIMIT = 5;
export const LOGIN_FAILURE_WINDOW_MS = 15 * 60 * 1000;

/** True when this key has too many recent failures to be allowed another try. */
export function isLockedOut(key: string): boolean {
  return prune(failures, key, LOGIN_FAILURE_WINDOW_MS).length >= LOGIN_FAILURE_LIMIT;
}

export function recordFailure(key: string): void {
  const fresh = prune(failures, key, LOGIN_FAILURE_WINDOW_MS);
  fresh.push(Date.now());
  failures.set(key, fresh);
}

export function clearFailures(key: string): void {
  failures.delete(key);
}
