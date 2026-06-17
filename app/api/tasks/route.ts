import { NextResponse } from "next/server";
import * as store from "@/lib/store";
import type { Domain } from "@/lib/types";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const domain = (url.searchParams.get("domain") ?? "instruction") as Domain;
  const tasks = await store.getTasks(domain);
  return NextResponse.json({ tasks: tasks.map(store.toPublic) });
}
