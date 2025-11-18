// import { Redis } from "@upstash/redis";

// export class RateLimitError extends Error {
//   status = 429;
//   headers: Record<string, string>;
//   constructor(message = "Too Many Requests", retryAfterSec = 30) {
//     super(message);
//     this.name = "RateLimitError";
//     this.headers = { "Retry-After": String(retryAfterSec) };
//   }
// }

// const redis = new Redis({
//   url: process.env.UPSTASH_REDIS_REST_URL!,
//   token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// });

// function ipFrom(req: Request) {
//   const xff = req.headers.get("x-forwarded-for");
//   return (xff?.split(",")[0] ?? "unknown").trim();
// }

// export async function rateLimit(
//   req: Request,
//   limit = 30,
//   windowSec = 600
// ): Promise<void> {
//   const ip = ipFrom(req);
//   const bucket = `rl:${ip}`;
//   const now = Math.floor(Date.now() / 1000);
//   const tx = redis.multi();
//   tx.zremrangebyscore(bucket, 0, now - windowSec);
//   tx.zadd(bucket, { score: now, member: `${now}:${Math.random()}` });
//   tx.zcard(bucket);
//   tx.expire(bucket, windowSec);
//   const [, , count] = (await tx.exec()) as [unknown, unknown, number, unknown];
//   if (count > limit) {
//     throw new RateLimitError("Rate limit exceeded", 30);
//   }
// }

import { Redis } from "@upstash/redis";

export class RateLimitError extends Error {
  status = 429;
  headers: Record<string, string>;
  constructor(msg = "Too Many Requests", retryAfterSec = 30) {
    super(msg);
    this.headers = { "Retry-After": String(retryAfterSec) };
  }
}

type Bucket = { times: number[] };
const memStore = new Map<string, Bucket>();

function getIp(req: Request) {
  const xff = req.headers.get("x-forwarded-for");
  return (xff?.split(",")[0] ?? "unknown").trim();
}

export async function rateLimit(req: Request, limit = 30, windowSec = 600) {
  // Don’t rate-limit during tests
  if (process.env.NODE_ENV === "test") return;

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  // If Redis not configured, use in-memory bucket (usually for local developing)
  if (!url || !token) {
    const ip = getIp(req);
    const now = Date.now();
    const bucket = memStore.get(ip) ?? { times: [] };
    // evict old
    const cutoff = now - windowSec * 1000;
    bucket.times = bucket.times.filter((t) => t > cutoff);
    bucket.times.push(now);
    memStore.set(ip, bucket);
    if (bucket.times.length > limit) throw new RateLimitError();
    return;
  }

  // Redis path
  const redis = new Redis({ url, token });
  const ip = getIp(req);
  const key = `rl:${ip}`;
  const nowSec = Math.floor(Date.now() / 1000);

  // ZSET rolling window
  await redis.zremrangebyscore(key, 0, nowSec - windowSec);
  await redis.zadd(key, {
    score: nowSec,
    member: `${nowSec}:${Math.random()}`,
  });
  const count = (await redis.zcard(key)) as number;
  await redis.expire(key, windowSec);
  if (count > limit) throw new RateLimitError();
}
