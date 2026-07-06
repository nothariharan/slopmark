import { NextResponse } from "next/server";
import { upvoteRun } from "@/lib/store/sqlite-store";

export async function POST(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });
    
    await upvoteRun(id);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
