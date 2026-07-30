/**
 * Fireworks serverless frontier panel
 *
 * these are the whole "actually strong" models we use for cursed packs
 * (slop chaos / trap season) and for /bench when FIREWORKS_API_KEY is set.
 * short slugs resolve to accounts/fireworks/models/<id> in openrouter.ts
 *
 * host openrouter free tier stays the default for vercel visitors —
 * fireworks is the local / keyed path so we dont eat the 1 req/min limit
 */

export type FireworksModel = {
  name: string;
  /** app slug — always fireworks/<id> */
  slug: string;
  /** bare fireworks model id */
  id: string;
};

/** curated frontier — kimi k3 + newer siblings that smoke clean on our key */
export const fireworksFrontierModels: FireworksModel[] = [
  { name: "kimi k3 (fireworks)", slug: "fireworks/kimi-k3", id: "kimi-k3" },
  { name: "kimi k2.6 (fireworks)", slug: "fireworks/kimi-k2p6", id: "kimi-k2p6" },
  { name: "kimi k2.7 code (fireworks)", slug: "fireworks/kimi-k2p7-code", id: "kimi-k2p7-code" },
  { name: "glm 5.2 (fireworks)", slug: "fireworks/glm-5p2", id: "glm-5p2" },
  { name: "deepseek v4 pro (fireworks)", slug: "fireworks/deepseek-v4-pro", id: "deepseek-v4-pro" },
  { name: "deepseek v4 flash (fireworks)", slug: "fireworks/deepseek-v4-flash", id: "deepseek-v4-flash" },
  { name: "gpt-oss 120b (fireworks)", slug: "fireworks/gpt-oss-120b", id: "gpt-oss-120b" },
  { name: "minimax m3 (fireworks)", slug: "fireworks/minimax-m3", id: "minimax-m3" },
  { name: "qwen3.7 plus (fireworks)", slug: "fireworks/qwen3p7-plus", id: "qwen3p7-plus" },
];

/** classic 5-model curse panel (slop chaos / early trap season) */
export const fireworksCursePanel = fireworksFrontierModels.filter((m) =>
  ["kimi-k3", "kimi-k2p6", "glm-5p2", "deepseek-v4-pro", "gpt-oss-120b"].includes(m.id),
);

/** newer adds on top of the classic panel */
export const fireworksCursePanelExtras = fireworksFrontierModels.filter((m) =>
  ["kimi-k2p7-code", "deepseek-v4-flash", "minimax-m3", "qwen3p7-plus"].includes(m.id),
);

export function isFireworksSlug(slug: string) {
  return slug.startsWith("fireworks/");
}
