import { NextResponse } from "next/server";
import * as store from "@/lib/store";

export async function GET() {
  const runs = await store.listRuns(10);
  return NextResponse.json({ runs });
}
