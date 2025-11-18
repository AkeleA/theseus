import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL!;
const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

const redis = new Redis({ url, token });

const key = (code: string) => `u:${code}`;

export async function cacheGet(code: string): Promise<string | null> {
  return (await redis.get<string>(key(code))) ?? null;
}
export async function cacheSet(
  code: string,
  longUrl: string,
  ttlSec = 60 * 60 * 24 * 30
) {
  await redis.set(key(code), longUrl, { ex: ttlSec });
}
export async function cacheDel(code: string) {
  await redis.del(key(code));
}
