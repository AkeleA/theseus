import { describe, it, expect, vi } from "vitest";
import { POST } from "@/app/api/admin/invalidate/route";

vi.mock("@/lib/repo", () => ({ repoDisable: vi.fn(async () => {}) }));
vi.mock("@/lib/cache", () => ({ cacheDel: vi.fn(async () => {}) }));

function req(code: string, token?: string): Request {
  return new Request("http://localhost/api/admin/invalidate", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ code }),
  });
}

describe("POST /api/admin/invalidate", () => {
  it("requires auth", async () => {
    const res = await POST(req("abc"));
    expect(res.status).toBe(401);
  });

  it("disables and purges on success", async () => {
    process.env.HERMES_ADMIN_TOKEN = "t";
    const res = await POST(req("abc123XYZ", "t"));
    expect(res.status).toBe(200);
  });
});
