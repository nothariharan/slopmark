import { NextResponse } from "next/server";
import { getShameRuns } from "@/lib/store/sqlite-store";

export async function GET() {
  const runs = await getShameRuns(50);
  return NextResponse.json({ runs });
}
