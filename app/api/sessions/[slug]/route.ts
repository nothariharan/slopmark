import { NextResponse } from "next/server";
import { loadSession } from "@/lib/challenges/sessions";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const data = await loadSession(slug);
  if (!data) {
    return NextResponse.json({ error: "session not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
