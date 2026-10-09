// 60 voice notes an hour per user, counted from the user's own captures rows
// (no Redis): far above real use, low enough to cap a runaway loop's AI bill.
export const CAPTURES_PER_HOUR = 60;
const WINDOW_MS = 60 * 60 * 1000;

// Given how many captures the user made in the last hour and when the oldest
// of those was made, says whether another is allowed and, if not, when.
export function checkRateLimit({
  countInWindow,
  oldestInWindow,
  now = Date.now(),
  limit = CAPTURES_PER_HOUR,
}: {
  countInWindow: number;
  oldestInWindow: Date | string | null;
  now?: number;
  limit?: number;
}): { allowed: true } | { allowed: false; retryAfterSeconds: number } {
  if (countInWindow < limit) return { allowed: true };
  const oldest = oldestInWindow ? new Date(oldestInWindow).getTime() : now;
  const retryAfterSeconds = Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000));
  return { allowed: false, retryAfterSeconds };
}

// "about 12 minutes", for telling someone when a held note will go.
export function describeWait(seconds: number) {
  if (seconds < 45) return "a few seconds";
  const minutes = Math.round(seconds / 60);
  if (minutes <= 1) return "about a minute";
  if (minutes < 60) return `about ${minutes} minutes`;
  return "about an hour";
}

// The start of the window, for the query: captures created after this count.
export function rateLimitWindowStart(now = Date.now()) {
  return new Date(now - WINDOW_MS).toISOString();
}
