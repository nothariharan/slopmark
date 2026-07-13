"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Markdown } from "@/components/Markdown";

type Message = {
  role: "model_a" | "model_b";
  content: string;
};

export default function ThunderdomePage() {
  const [topic, setTopic] = useState<any>(null);
  const [modelA, setModelA] = useState<string>("");
  const [modelB, setModelB] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "debating" | "voting" | "done">("loading");
  const [currentTurn, setCurrentTurn] = useState<"model_a" | "model_b">("model_a");
  const [winner, setWinner] = useState<string | null>(null);

  const fetchTopic = async () => {
    setStatus("loading");
    setMessages([]);
    setWinner(null);
    const res = await fetch("/api/thunderdome/topic");
    const data = await res.json();
    setTopic(data.topic);
    setModelA(data.modelA);
    setModelB(data.modelB);
    setStatus("ready");
  };

  useEffect(() => {
    fetchTopic();
  }, []);

  const runTurn = async (role: "model_a" | "model_b", currentMsgs: Message[]) => {
    const slug = role === "model_a" ? modelA : modelB;
    const sideInstruction = role === "model_a" ? topic.side_a : topic.side_b;
    
    // Convert current messages to generic chat history for the prompt
    const chatHistory = currentMsgs.map(m => ({
      role: m.role === role ? "assistant" : "user",
      content: m.content
    }));

    const res = await fetch("/api/thunderdome/turn", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ modelSlug: slug, messages: chatHistory, sideInstruction })
    });

    if (!res.body) return "";

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let fullOutput = "";

    setMessages(prev => [...prev, { role, content: "" }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value);
      const lines = chunk.split("\n");
      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const dataStr = line.replace("data: ", "").trim();
          if (!dataStr) continue;
          try {
            const data = JSON.parse(dataStr);
            if (data.done) {
              break;
            }
            if (typeof data === "string") {
              fullOutput += data;
              setMessages(prev => {
                const next = [...prev];
                next[next.length - 1].content = fullOutput;
                return next;
              });
            }
          } catch (e) {
            console.error("sse parse error", e);
          }
        }
      }
    }
    return fullOutput;
  };

  const startDebate = async () => {
    setStatus("debating");
    let msgs: Message[] = [];
    
    // Turn 1
    setCurrentTurn("model_a");
    const outA1 = await runTurn("model_a", msgs);
    msgs.push({ role: "model_a", content: outA1 });

    setCurrentTurn("model_b");
    const outB1 = await runTurn("model_b", msgs);
    msgs.push({ role: "model_b", content: outB1 });

    // Turn 2
    setCurrentTurn("model_a");
    const outA2 = await runTurn("model_a", msgs);
    msgs.push({ role: "model_a", content: outA2 });

    setCurrentTurn("model_b");
    const outB2 = await runTurn("model_b", msgs);
    msgs.push({ role: "model_b", content: outB2 });

    setStatus("voting");
  };

  const castVote = async (choice: "a" | "b" | "tie") => {
    setWinner(choice);
    setStatus("done");
    await fetch("/api/arena/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: topic.id,
        modelA,
        modelB,
        winner: choice
      })
    });
  };

  if (status === "loading") {
    return <div className="p-8 text-center animate-pulse">entering the thunderdome...</div>;
  }

  return (
    <div className="min-h-screen bg-black text-zinc-100 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold uppercase tracking-widest text-red-500">Thunderdome</h1>
          <p className="text-zinc-400">Two agents enter. One agent leaves.</p>
        </div>

        {topic && (
          <Card className="p-6 bg-zinc-900 border-zinc-800">
            <h2 className="text-xl font-bold mb-2 text-white">Topic</h2>
            <p className="text-zinc-300">{topic.prompt}</p>
          </Card>
        )}

        {status === "ready" && (
          <div className="flex justify-center">
            <Button onClick={startDebate} className="bg-red-600 hover:bg-red-700 text-white font-bold py-6 px-12 text-xl rounded-none">
              BEGIN DEBATE
            </Button>
          </div>
        )}

        <div className="space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "model_a" ? "justify-start" : "justify-end"}`}>
              <Card className={`p-4 max-w-[80%] ${msg.role === "model_a" ? "bg-zinc-800 border-zinc-700" : "bg-red-950 border-red-900"}`}>
                <div className={`text-xs font-bold uppercase mb-2 ${msg.role === "model_a" ? "text-zinc-400" : "text-red-400"}`}>
                  {status === "done" ? (msg.role === "model_a" ? modelA : modelB) : `Model ${msg.role === "model_a" ? "A" : "B"}`}
                </div>
                <Markdown content={msg.content} />
              </Card>
            </div>
          ))}
          
          {status === "debating" && (
            <div className={`text-xs font-bold uppercase animate-pulse ${currentTurn === "model_a" ? "text-left text-zinc-500" : "text-right text-red-500"}`}>
              Model {currentTurn === "model_a" ? "A" : "B"} is typing...
            </div>
          )}
        </div>

        {status === "voting" && (
          <Card className="p-6 bg-zinc-900 border-zinc-800 text-center space-y-6 border-2 border-red-500">
            <h2 className="text-2xl font-bold text-white">WHO WON?</h2>
            <div className="grid grid-cols-3 gap-4">
              <Button onClick={() => castVote("a")} className="h-16 text-lg bg-zinc-800 hover:bg-zinc-700 text-white">Model A</Button>
              <Button onClick={() => castVote("tie")} className="h-16 text-lg bg-zinc-800 hover:bg-zinc-700 text-white">Tie</Button>
              <Button onClick={() => castVote("b")} className="h-16 text-lg bg-red-900 hover:bg-red-800 text-white">Model B</Button>
            </div>
          </Card>
        )}

        {status === "done" && (
          <div className="text-center space-y-6 p-6 border-2 border-zinc-800">
            <h2 className="text-2xl font-bold">Results</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 ${winner === "a" ? "bg-green-900/20 text-green-400" : "text-zinc-500"}`}>
                Model A: {modelA}
              </div>
              <div className={`p-4 ${winner === "b" ? "bg-green-900/20 text-green-400" : "text-zinc-500"}`}>
                Model B: {modelB}
              </div>
            </div>
            <Button onClick={fetchTopic} variant="outline" className="w-full">Next Debate</Button>
          </div>
        )}
      </div>
    </div>
  );
}
