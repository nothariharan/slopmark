import fs from "fs/promises";
import path from "path";

export type DocPage = {
  slug: string;
  title: string;
  desc: string;
  file: string;
};

export const docPages: DocPage[] = [
  {
    slug: "benchmarks",
    title: "how we bench",
    desc: "spine, anti-patterns, domain order",
    file: "benchmarks.md",
  },
  {
    slug: "domains",
    title: "domains",
    desc: "what each domain tests and why",
    file: "domains.md",
  },
  {
    slug: "judging",
    title: "scoring & verifiers",
    desc: "pass/fail contract, plugins, flow",
    file: "JUDGING.md",
  },
  {
    slug: "harness",
    title: "harness",
    desc: "fixed model run conditions",
    file: "harness.md",
  },
  {
    slug: "tasks",
    title: "tasks & contamination",
    desc: "sourcing, approval, trust tiers",
    file: "tasks.md",
  },
  {
    slug: "metrics",
    title: "metrics & leaderboard",
    desc: "what we measure and how rankings work",
    file: "metrics.md",
  },
  {
    slug: "api",
    title: "api",
    desc: "endpoints and payloads",
    file: "api.md",
  },
  {
    slug: "aimlapi",
    title: "aiml api testing",
    desc: "cheap live model runs via AIMLAPI_KEY",
    file: "aimlapi.md",
  },
  {
    slug: "challenges",
    title: "benchmark challenges",
    desc: "fixed niche sprints, sql persistence, revisit infographic",
    file: "challenges.md",
  },
  {
    slug: "realshot",
    title: "realshot duels",
    desc: "BYOK agent battles, one-shot tasks, auto winner",
    file: "realshot.md",
  },
  {
    slug: "zero-context",
    title: "zero context mode",
    desc: "no system prompt, structural HTML contracts",
    file: "zero-context.md",
  },
  {
    slug: "architecture",
    title: "architecture",
    desc: "layers, data flow, file map",
    file: "ARCHITECTURE.md",
  },
  {
    slug: "deepswe",
    title: "deepswe template",
    desc: "reference pattern we generalize",
    file: "deepswe.md",
  },
];

const root = path.join(process.cwd(), "docs");

const linkMap: Record<string, string> = {
  "./ARCHITECTURE.md": "/docs/architecture",
  "./JUDGING.md": "/docs/judging",
  "./deepswe.md": "/docs/deepswe",
  "./benchmarks.md": "/docs/benchmarks",
  "./domains.md": "/docs/domains",
  "./harness.md": "/docs/harness",
  "./tasks.md": "/docs/tasks",
  "./metrics.md": "/docs/metrics",
  "./api.md": "/docs/api",
  "./zero-context.md": "/docs/zero-context",
  "./realshot.md": "/docs/realshot",
  "./aimlapi.md": "/docs/aimlapi",
  "./challenges.md": "/docs/challenges",
  "ARCHITECTURE.md": "/docs/architecture",
  "JUDGING.md": "/docs/judging",
  "deepswe.md": "/docs/deepswe",
  "benchmarks.md": "/docs/benchmarks",
  "domains.md": "/docs/domains",
  "harness.md": "/docs/harness",
  "tasks.md": "/docs/tasks",
  "metrics.md": "/docs/metrics",
  "api.md": "/docs/api",
  "zero-context.md": "/docs/zero-context",
  "realshot.md": "/docs/realshot",
  "aimlapi.md": "/docs/aimlapi",
  "challenges.md": "/docs/challenges",
};

export function getDoc(slug: string) {
  return docPages.find((d) => d.slug === slug) ?? null;
}

export async function readDoc(slug: string) {
  const doc = getDoc(slug);
  if (!doc) return null;
  const raw = await fs.readFile(path.join(root, doc.file), "utf8");
  return { ...doc, body: fixLinks(raw) };
}

function fixLinks(md: string) {
  let out = md;
  for (const [from, to] of Object.entries(linkMap)) {
    out = out.replaceAll(`](${from})`, `](${to})`);
  }
  return out;
}



// js a file to manage all my docs file instead of js routing them to keep it clean i generally do it this way so yeah 