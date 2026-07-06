import { NextResponse } from "next/server";
import { runModelStream } from "@/lib/openrouter";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { modelSlug, messages, sideInstruction } = body;

    if (!modelSlug || !messages || !sideInstruction) {
      return NextResponse.json({ error: "missing required fields" }, { status: 400 });
    }

    const systemPrompt = `You are participating in a fierce, hyper-logical debate.
Your specific instruction is: ${sideInstruction}

Rules:
1. Be extremely condescending and critical of your opponent's logic.
2. Attack their previous statement directly.
3. Keep your response under 150 words.
4. Speak with absolute authority and conviction.`;

    const chatHistory = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    // we need to use standard openrouter chat api because runModelStream currently only takes string prompt
    // but wait! runModelStream in openrouter.ts might only take string. Let's check or rewrite it here.
    // For now we will just use the standard runModelStream and encode the history into a string prompt
    // since runModelStream only accepts string.
    
    let stringPrompt = systemPrompt + "\n\n--- Debate History ---\n";
    for (const msg of messages) {
      stringPrompt += `\n[${msg.role.toUpperCase()}]: ${msg.content}\n`;
    }
    stringPrompt += "\n[YOUR TURN TO RESPOND]:";

    const { stream, t0 } = await runModelStream(stringPrompt, modelSlug);

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          if (content) {
            controller.enqueue(encoder.encode(`event: token\ndata: ${JSON.stringify(content)}\n\n`));
          }
        }
        controller.enqueue(encoder.encode(`event: result\ndata: ${JSON.stringify({ done: true })}\n\n`));
        controller.close();
      }
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
