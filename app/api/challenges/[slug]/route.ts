import { NextResponse } from "next/server";
import { listChallengeSlugs, loadChallengeResults } from "@/lib/challenges/store";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ slug: string }> },
) {
  const { slug } = await ctx.params;
  const data = await loadChallengeResults(slug);
  if (!data) {
    return NextResponse.json({ error: "challenge not found" }, { status: 404 });
  }
  return NextResponse.json(data);
}
