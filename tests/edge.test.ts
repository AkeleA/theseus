import { describe, it, expect, vi, beforeAll } from "vitest";
import type { NextRequest } from "next/server";

// ---- Mock Upstash Redis (in-memory) ----
vi.mock("@upstash/redis", () => {
  const store = new Map<string, string>();
  class Redis {
    async get(k: string) {
      return store.get(k) ?? null;
    }
    async set(k: string, v: string) {
      store.set(k, v);
      return "OK";
    }
    async del() {
      return 1;
    }
  }
  return { Redis };
});

// ---- Mock fetch for /api/get fallback (typed: typeof fetch) ----
const mockFetch: typeof fetch = vi.fn(async (input: RequestInfo | URL) => {
  const urlStr =
    typeof input === "string"
      ? input
      : input instanceof URL
      ? input.toString()
      : (input as Request).url;

  const u = new URL(urlStr);
  if (u.pathname === "/api/get" && u.searchParams.get("code") === "abc") {
    return new Response(JSON.stringify({ longUrl: "https://example.com/" }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }
  return new Response("Not Found", { status: 404 });
});

beforeAll(() => {
  globalThis.fetch = mockFetch;
});

// Import after mocks
import { GET } from "@/app/[code]/route";

describe("edge redirect", () => {
  it("301s via fallback and warms cache", async () => {
    const req = new Request(
      "https://hermes.test/abc"
    ) as unknown as NextRequest;

    const res = await GET(req, {
      params: Promise.resolve({ code: "abc" }),
    });

    expect(res.status).toBe(301);
    const location = res.headers.get("location");
    expect(location).toMatch(/^https:\/\/example\.com\/?$/);
    expect(res.headers.get("Cache-Control")).toMatch(/max-age=31536000/);
  });
});
