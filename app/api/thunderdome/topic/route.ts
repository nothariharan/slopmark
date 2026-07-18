import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { openRouterFreeModels } from "@/lib/openrouter-free";

// host-funded free OpenRouter pool
const DEBATE_MODELS = openRouterFreeModels.slice(0, 6).map((m) => m.slug);

function getRandomModels() {
  const shuffled = [...DEBATE_MODELS].sort(() => 0.5 - Math.random());
  return [shuffled[0], shuffled[1]];
}

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), "data", "tasks", "debate.json");
    const raw = fs.readFileSync(dataPath, "utf-8");
    const topics = JSON.parse(raw);

    const topic = topics[Math.floor(Math.random() * topics.length)];
    const models = getRandomModels();

    return NextResponse.json({
      topic,
      modelA: models[0],
      modelB: models[1],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
