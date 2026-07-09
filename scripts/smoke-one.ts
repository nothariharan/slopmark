#!/usr/bin/env npx tsx
import fs from "fs";
import path from "path";
import { smokeTestProvider } from "../lib/openrouter";

function loadEnvLocal() {
  try {
    const raw = fs.readFileSync(path.join(process.cwd(), ".env.local"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq <= 0) continue;
      const key = trimmed.slice(0, eq).trim();
      const val = trimmed.slice(eq + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  } catch {
    /* no .env.local */
  }
}

async function main() {
  loadEnvLocal();
  const slug = process.argv[2];
  if (!slug) throw new Error("usage: npx tsx scripts/smoke-one.ts aiml/...");
  const r = await smokeTestProvider(slug);
  console.log(JSON.stringify(r));
  process.exit(r.ok ? 0 : 1);
}

main();
