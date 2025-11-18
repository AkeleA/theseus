export const runtime = "nodejs";
import { NextResponse } from "next/server";
import { repoGet } from "@/lib/repo";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code") || "";
  if (!code) return new NextResponse("Bad code", { status: 400 });

  const longUrl = await repoGet(decodeURIComponent(code));
  return NextResponse.json({ longUrl });
}
