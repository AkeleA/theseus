import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "@/app/api/shorten/route";

vi.mock("@/lib/repo", () => ({
  repoCreate: vi.fn(async (_c: string, _u: string) => ({})),
  isUniqueViolation: (_e: unknown) => false,
}));

vi.mock("@/lib/cache", () => ({
  cacheSet: vi.fn(async () => {}),
}));

vi.mock("@/lib/rate-limit", () => ({
  rateLimit: vi.fn(async () => {}),
  RateLimitError: class extends Error {
    status = 429;
    headers = { "Retry-After": "1" };
  },
}));

function req(body: unknown, ip = "1.2.3.4"): Request {
  return new Request("http://localhost/api/shorten", {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify(body),
  });
}

describe("POST /api/shorten", () => {
  beforeEach(() => {
    process.env.BASE_URL = "https://hermes.test";
  });

  it("rejects invalid body", async () => {
    const res = await POST(req({ long_url: "notaurl" }));
    expect(res.status).toBe(400);
  });

  it("creates a short url", async () => {
    const res = await POST(req({ long_url: "https://example.com" }));
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.short_url).toMatch(/^https:\/\/hermes\.test\//);
  });
});
