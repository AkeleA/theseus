export const runtime = "edge";
import { NextResponse } from "next/server";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function GET(
  req: Request,
  { params }: { params: { code: string } }
) {
  // decode so custom aliases like "my/custom" work
  const code = decodeURIComponent(params.code);

  // 1) Trying cache
  let longUrl = await redis.get<string>(`u:${code}`);

  // 2) Fallback to Node API for DB lookup
  if (!longUrl) {
    const origin = new URL(req.url).origin;
    const api = new URL("/api/get", origin);
    api.searchParams.set("code", code);
    const r = await fetch(api.toString(), { cache: "no-store" });
    if (r.ok) {
      const data = (await r.json()) as { longUrl: string | null };
      longUrl = data.longUrl ?? null;
      if (longUrl) {
        // Warm cache
        await redis.set(`u:${code}`, longUrl, { ex: 60 * 60 * 24 * 30 });
      }
    }
  }

  if (!longUrl) return new NextResponse("Not Found", { status: 404 });

  // 301 + long-lived caching (CDN + browser)
  const res = NextResponse.redirect(longUrl, 301);
  res.headers.set("Cache-Control", "public, max-age=31536000, immutable");
  res.headers.set("CDN-Cache-Control", "public, s-maxage=31536000, immutable");
  return res;
}

// NO CACHE VERSION
// export const runtime = "nodejs";

// import { NextResponse } from "next/server";
// import { repoGet } from "@/lib/repo";

// export async function GET(
//   _req: Request,
//   { params }: { params: { code: string } }
// ) {
//   const code = params.code;
//   if (!/^[0-9a-zA-Z]{4,64}$/.test(code)) {
//     return new NextResponse("Not Found", { status: 404, headers: noCache });
//   }

//   const longUrl = await repoGet(code);
//   if (!longUrl) {
//     return new NextResponse("Not Found", { status: 404, headers: noCache });
//   }

//   // Use 307 while debugging (no browser/permanent caching)
//   const res = NextResponse.redirect(longUrl, 307);
//   setNoCache(res.headers);
//   return res;
// }

// const noCache = {
//   "Cache-Control":
//     "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
//   Pragma: "no-cache",
//   Expires: "0",
// };

// function setNoCache(h: Headers) {
//   Object.entries(noCache).forEach(([k, v]) => h.set(k, v));
// }
