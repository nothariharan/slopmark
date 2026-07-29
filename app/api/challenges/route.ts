import { NextResponse } from "next/server";
import { listChallengeSlugs, loadChallengeResults } from "@/lib/challenges/store-json";

export async function GET() {
  const slugs = await listChallengeSlugs();
  const items = [];
  for (const slug of slugs) {
    const data = await loadChallengeResults(slug);
    if (data) {
      items.push({
        slug,
        title: data.manifest.title,
        subtitle: data.manifest.subtitle,
        completed_at: data.completed_at,
        models: data.manifest.models.length,
        tasks: data.manifest.tasks.length,
        top_model: [...data.summaries].sort((a, b) => b.pass_rate - a.pass_rate)[0]?.model_label,
      });
    }
  }
  // newest first so fresh sessions like slop-chaos land in the featured strip
  items.sort((a, b) => b.completed_at.localeCompare(a.completed_at));
  return NextResponse.json({ challenges: items });
}
