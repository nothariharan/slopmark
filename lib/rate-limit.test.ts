import { afterEach, describe, expect, it } from "vitest";
import {
  HOST_RL_COOKIE,
  _resetRateLimitBucketsForTests,
  checkHostLimit,
} from "./rate-limit";

function req(cookie?: string) {
  return new Request("http://localhost/api/eval/run", {
    method: "POST",
    headers: {
      "x-forwarded-for": "203.0.113.10",
      ...(cookie ? { cookie } : {}),
    },
  });
}

afterEach(() => {
  _resetRateLimitBucketsForTests();
});

describe("checkHostLimit", () => {
  it("allows the first host request", () => {
    const r = checkHostLimit(req());
    expect(r.ok).toBe(true);
    expect(r.setCookie).toContain(HOST_RL_COOKIE);
  });

  it("blocks a second request within a minute via cookie", () => {
    const first = checkHostLimit(req());
    expect(first.ok).toBe(true);
    const stamped = `${HOST_RL_COOKIE}=${Date.now()}`;
    const second = checkHostLimit(req(stamped));
    expect(second.ok).toBe(false);
    expect(second.retryIn).toBeGreaterThan(0);
    expect(second.retryIn).toBeLessThanOrEqual(60);
  });

  it("blocks a second request within a minute via IP memory", () => {
    expect(checkHostLimit(req()).ok).toBe(true);
    // no cookie — same IP still blocked in-process
    const second = checkHostLimit(req());
    expect(second.ok).toBe(false);
  });
});
