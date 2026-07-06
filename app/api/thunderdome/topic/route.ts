import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

// Simple hardcoded pool of competitive models for debates
const DEBATE_MODELS = [
  "anthropic/claude-3.5-sonnet",
  "openai/gpt-4o",
  "google/gemini-1.5-pro",
  "meta-llama/llama-3-70b-instruct"
];

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
      modelB: models[1]
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
