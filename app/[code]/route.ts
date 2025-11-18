export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Next 16 expects `context.params` to be a Promise<{ code: string }>
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ code: string }> }
) {
  const { code: rawCode } = await context.params;
  const code = decodeURIComponent(rawCode);

  // 1) Try Redis cache
  let longUrl = await redis.get<string>(`u:${code}`);

  // 2) Fallback to Node API for DB lookup
  if (!longUrl) {
    const origin = req.nextUrl.origin;
    const api = new URL("/api/get", origin);
    api.searchParams.set("code", code);

    const r = await fetch(api.toString(), { cache: "no-store" });
    if (r.ok) {
      const data = (await r.json()) as { longUrl: string | null };
      longUrl = data.longUrl ?? null;

      // Warm cache if we found something
      if (longUrl) {
        await redis.set(`u:${code}`, longUrl, {
          ex: 60 * 60 * 24 * 30, // 30 days
        });
      }
    }
  }

  if (!longUrl) {
    return new NextResponse("Not Found", { status: 404 });
  }

  // 301 redirect + long-lived caching
  const res = NextResponse.redirect(longUrl, 301);
  res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  res.headers.set("CDN-Cache-Control", "public, s-maxage=31536000, immutable");
  return res;
}
