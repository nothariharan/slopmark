import Ajv from "ajv";
import type { VerifierResult } from "../types";

const ajv = new Ajv({ allErrors: true });

// models often wrap JSON in code fences even when told not to
function extractJSON(raw: string): string {
  const fence = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  return raw.trim();
}

export function verifyJSON(output: string, schema: object): VerifierResult {
  const text = extractJSON(output);

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { passed: false, score: 0, details: "output is not valid JSON" };
  }

  let validate: ReturnType<typeof ajv.compile>;
  try {
    validate = ajv.compile(schema);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "bad schema";
    return { passed: false, score: 0, details: `schema error: ${msg}` };
  }

  const ok = validate(parsed) as boolean;
  if (ok) {
    return { passed: true, score: 100, details: "valid JSON, schema matched" };
  }

  const errors = (validate.errors ?? [])
    .map((e) => `${e.dataPath || "root"}: ${e.message}`)
    .join("; ");

  return { passed: false, score: 0, details: `schema validation failed — ${errors}` };
}
