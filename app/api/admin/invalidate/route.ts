import { NextResponse } from "next/server";
import { cacheDel } from "@/lib/cache";
import { repoDisable } from "@/lib/repo";

function isAuthed(req: Request) {
  const auth = req.headers.get("authorization") || ""; //for the bearer
  const token = auth.split(" ")[1];
  return token && token === process.env.HERMES_ADMIN_TOKEN;
}

export async function POST(req: Request) {
  if (!isAuthed(req)) return new NextResponse("Unauthorized", { status: 401 });
  const { code } = await req.json();
  if (!/^[0-9a-zA-Z]{4,64}$/.test(code))
    return new NextResponse("Bad code", { status: 400 });
  await repoDisable(code);
  await cacheDel(code);
  return NextResponse.json({ ok: true });
}
