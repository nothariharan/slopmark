const WINDOW_MS = 60_000;

/** host-funded OpenRouter free tier — 1 LLM request per minute per user */
const MAX_HOST = 1;
/** BYOK / paste can be a bit looser */
const MAX_BYOK_RUN = 30;
const MAX_BYOK_SUITE = 3;
const MAX_BYOK_DUEL = 10;

export const HOST_RL_COOKIE = "slopmark_host_rl";

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

function check(kind: string, id: string, max: number): { ok: boolean; retryIn?: number } {
  const now = Date.now();
  const key = `${kind}:${id}`;
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { count: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, b);
  }
  if (b.count >= max) {
    return { ok: false, retryIn: Math.ceil((b.resetAt - now) / 1000) };
  }
  b.count++;
  return { ok: true };
}

export function getIp(req: Request): string {
  const vercel = req.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

function readCookie(req: Request, name: string): string | null {
  const raw = req.headers.get("cookie");
  if (!raw) return null;
  for (const part of raw.split(";")) {
    const [k, ...rest] = part.trim().split("=");
    if (k === name) return decodeURIComponent(rest.join("="));
  }
  return null;
}

export type HostLimitResult = {
  ok: boolean;
  retryIn?: number;
  /** set this cookie on the response when ok */
  setCookie?: string;
};

/**
 * Hard 1 req/min for host-funded runs.
 * Cookie survives serverless instance hops; IP bucket catches same-instance spam.
 */
export function checkHostLimit(req: Request): HostLimitResult {
  const now = Date.now();
  const ip = getIp(req);

  const lastRaw = readCookie(req, HOST_RL_COOKIE);
  const last = lastRaw ? Number(lastRaw) : NaN;
  if (Number.isFinite(last)) {
    const elapsed = now - last;
    if (elapsed < WINDOW_MS) {
      return { ok: false, retryIn: Math.ceil((WINDOW_MS - elapsed) / 1000) };
    }
  }

  const mem = check("host", ip, MAX_HOST);
  if (!mem.ok) return { ok: false, retryIn: mem.retryIn };

  return {
    ok: true,
    setCookie: `${HOST_RL_COOKIE}=${now}; Path=/; Max-Age=120; SameSite=Lax`,
  };
}

export function checkRunLimit(ip: string) {
  return check("run", ip, MAX_BYOK_RUN);
}

export function checkSuiteLimit(ip: string) {
  return check("suite", ip, MAX_BYOK_SUITE);
}

export function checkDuelLimit(ip: string) {
  return check("duel", ip, MAX_BYOK_DUEL);
}

export function applyHostLimitCookie(res: NextResponseLike, limit: HostLimitResult) {
  if (limit.setCookie) res.headers.set("Set-Cookie", limit.setCookie);
}

type NextResponseLike = { headers: { set: (k: string, v: string) => void } };

/**
 * Host-funded LLM calls → 1/min (cookie + IP).
 * BYOK / paste scoring → looser buckets.
 */
export function checkLlmLimit(
  req: Request,
  opts: { hostFunded: boolean; kind?: "run" | "suite" | "duel" },
): HostLimitResult {
  if (opts.hostFunded) return checkHostLimit(req);
  const ip = getIp(req);
  if (opts.kind === "suite") {
    const r = checkSuiteLimit(ip);
    return r.ok ? { ok: true } : { ok: false, retryIn: r.retryIn };
  }
  if (opts.kind === "duel") {
    const r = checkDuelLimit(ip);
    return r.ok ? { ok: true } : { ok: false, retryIn: r.retryIn };
  }
  const r = checkRunLimit(ip);
  return r.ok ? { ok: true } : { ok: false, retryIn: r.retryIn };
}

/** test helper — clear in-memory buckets */
export function _resetRateLimitBucketsForTests() {
  buckets.clear();
}
