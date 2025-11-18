import { NextResponse } from "next/server";
import { z } from "zod";
import { genCode } from "@/lib/base";
import { repoCreate, isUniqueViolation } from "@/lib/repo";
import { cacheSet } from "@/lib/cache";
import { rateLimit, RateLimitError } from "@/lib/limiter";

export const runtime = "nodejs"; // ensure Node runtime
export const dynamic = "force-dynamic"; // no static caching for POST

// Allow preflight/HEAD so we don't 405 on them
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS, HEAD",
      "Access-Control-Allow-Headers": "content-type",
    },
  });
}
export async function HEAD() {
  return new NextResponse(null, { status: 204 });
}

const Alias = z.preprocess(
  (v) => {
    if (v === "" || v === null || v === undefined) return undefined;
    if (typeof v === "string") return v.trim();
    return v;
  },
  z
    .string()
    .min(1, "Alias must be at least 1 character")
    .max(64, "Alias cannot exceed 64 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Alias can only contain letters, numbers, hyphens (-), and underscores (_)"
    )
    .optional()
);
const Body = z.object({
  long_url: z
    .string()
    .trim()
    .refine((s) => {
      try {
        const u = new URL(s);
        return u.protocol === "http:" || u.protocol === "https:";
      } catch {
        return false;
      }
    }, "long_url must be a valid http/https URL"),
  custom_alias: Alias.optional(),
});

// right after parsing, return details if invalid:

export async function POST(req: Request) {
  try {
    await rateLimit(req);
  } catch (e: unknown) {
    if (e instanceof RateLimitError) {
      return new NextResponse(e.message, {
        status: e.status,
        headers: e.headers,
      });
    }
    return new NextResponse("Rate limit error", { status: 429 });
  }

  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid body", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { long_url, custom_alias } = parsed.data;
  let code = custom_alias ?? genCode(9);
  const isCustom = !!custom_alias; // Track if user provided custom alias

  for (let i = 0; i < 5; i++) {
    try {
      await repoCreate(code, long_url);
      await cacheSet(code, long_url);
      const short = `${process.env.BASE_URL!.replace(/\/$/, "")}/${code}`;
      return NextResponse.json({ short_url: short, code }, { status: 201 });
    } catch (e: unknown) {
      if (isUniqueViolation(e)) {
        // If custom alias is taken, don't retry - return error immediately
        if (isCustom) {
          return NextResponse.json(
            { error: `Custom alias '${code}' is already taken` },
            { status: 409 } // 409 Conflict
          );
        }
        // Only generate new random code if it wasn't a custom alias
        code = genCode(9);
        continue;
      }
      throw e;
    }
  }
  return NextResponse.json({ error: "Allocation failed" }, { status: 500 });
}
