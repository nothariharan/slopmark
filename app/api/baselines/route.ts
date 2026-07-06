import { NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function GET() {
  try {
    const raw = await fs.readFile(
      path.join(process.cwd(), "data", "baselines", "latest.json"),
      "utf8",
    );
    return NextResponse.json(JSON.parse(raw));
  } catch {
    return NextResponse.json({ error: "no baseline snapshot yet — run npm run baseline" }, { status: 404 });
  }
}
