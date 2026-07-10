import type { ProviderConfig } from "./openrouter";

export type ByokAgent = {
  name: string;
  baseURL: string;
  apiKey: string;
  model: string;
};

export function validateByokAgent(a: unknown, label = "provider"): ByokAgent {
  if (!a || typeof a !== "object") throw new Error(`${label} required`);
  const o = a as Record<string, unknown>;
  if (!o.baseURL || !o.apiKey || !o.model) {
    throw new Error(`${label} needs baseURL, apiKey, model`);
  }
  return {
    name: o.name ? String(o.name) : String(o.model),
    baseURL: String(o.baseURL),
    apiKey: String(o.apiKey),
    model: String(o.model),
  };
}

export function byokSlug(agent: ByokAgent): string {
  const label = (agent.name || agent.model).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 48);
  return `byok/${label || "custom"}`;
}

export function providerConfig(agent: ByokAgent): ProviderConfig {
  return {
    baseURL: agent.baseURL.replace(/\/$/, ""),
    apiKey: agent.apiKey,
  };
}
