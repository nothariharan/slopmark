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
    desc: "the scoring loop, what we avoid, domain rollout",
    file: "benchmarks.md",
  },
  {
    slug: "judging",
    title: "scoring & verifiers",
    desc: "pass/fail rules, verifier types, what gets logged",
    file: "JUDGING.md",
  },
  {
    slug: "architecture",
    title: "architecture",
    desc: "platform layers, task shape, data flow",
    file: "ARCHITECTURE.md",
  },
  {
    slug: "deepswe",
    title: "deepswe template",
    desc: "why we copied this pattern for eval",
    file: "deepswe.md",
  },
];

const root = path.join(process.cwd(), "docs");

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
  const map: Record<string, string> = {
    "./ARCHITECTURE.md": "/docs/architecture",
    "./JUDGING.md": "/docs/judging",
    "./deepswe.md": "/docs/deepswe",
    "./PLAN.md": "/docs/architecture",
    "./benchmarks.md": "/docs/benchmarks",
    "ARCHITECTURE.md": "/docs/architecture",
    "JUDGING.md": "/docs/judging",
    "deepswe.md": "/docs/deepswe",
  };

  let out = md;
  for (const [from, to] of Object.entries(map)) {
    out = out.replaceAll(`](${from})`, `](${to})`);
  }
  return out;
}
