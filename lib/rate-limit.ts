const WINDOW_MS = 60_000;
const MAX_RUN = 30;
const MAX_SUITE = 3;

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function check(ip: string, max: number): { ok: boolean; retryIn?: number } {
  const now = Date.now();
  let b = buckets.get(ip);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(ip, b);
  }
  if (b.count >= max) {
    return { ok: false, retryIn: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count++;
  return { ok: true };
}

export function checkRunLimit(ip: string) { return check(ip, MAX_RUN); }
export function checkSuiteLimit(ip: string) { return check(ip, MAX_SUITE); }
export function checkDuelLimit(ip: string) { return check(ip, 10); }

export function getIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
