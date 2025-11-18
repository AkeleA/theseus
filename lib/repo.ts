import { prisma } from "@/lib/db";

export async function repoCreate(code: string, longUrl: string) {
  return prisma.url.create({ data: { code, longUrl } });
}

export async function repoGet(code: string): Promise<string | null> {
  const row = await prisma.url.findFirst({
    where: { code, isActive: true },
    select: { longUrl: true },
  });
  return row ? row.longUrl : null;
}

export async function repoDisable(code: string) {
  await prisma.url.update({ where: { code }, data: { isActive: false } });
}

export function isUniqueViolation(e: unknown): boolean {
  return (
    typeof e === "object" && e !== null && "code" in e && e.code === "P2002"
  );
}
