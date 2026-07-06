import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type CustomSuite = {
  id: string;
  name: string;
  description?: string;
  task_ids: string[];
  is_public: boolean;
  created_at: string;
};

const file = path.join(process.cwd(), "data", "custom-suites.json");

async function load(): Promise<CustomSuite[]> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as CustomSuite[];
  } catch {
    return [];
  }
}

async function save(suites: CustomSuite[]) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(suites, null, 2));
}

export async function listSuites(publicOnly = false): Promise<CustomSuite[]> {
  const all = await load();
  return publicOnly ? all.filter((s) => s.is_public) : all;
}

export async function getSuite(id: string): Promise<CustomSuite | null> {
  return (await load()).find((s) => s.id === id) ?? null;
}

export async function createSuite(input: {
  name: string;
  description?: string;
  task_ids: string[];
  is_public?: boolean;
}): Promise<CustomSuite> {
  const suite: CustomSuite = {
    id: randomUUID(),
    name: input.name,
    description: input.description,
    task_ids: input.task_ids,
    is_public: input.is_public ?? false,
    created_at: new Date().toISOString(),
  };
  const all = await load();
  all.unshift(suite);
  await save(all);
  return suite;
}
