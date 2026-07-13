export const harnessVersion = "v0";

import type { HarnessMode } from "./types";

export const sysPrompt =
  "Follow the user instructions exactly. Output only what is asked, no preamble.";

/** zero context: no persona, no helpful-assistant framing, no extra rules */
export const zeroContextPrompt = "";

export const maxTok = 600;
export const temp = 0;

/** drawing tasks emit whole SVGs (and reasoning models think first) — give headroom */
export function maxTokFor(domain: string): number {
  return domain === "drawing" ? 4000 : maxTok;
}

export function systemPromptFor(mode: HarnessMode): string {
  return mode === "zero_context" ? zeroContextPrompt : sysPrompt;
}

export function harnessLabel(mode: HarnessMode): string {
  return mode === "zero_context" ? `${harnessVersion}:zero_context` : harnessVersion;
}

// will further try to extend this whole concept fo harness as thats the curernt new generationw e are having right now with like mutliple people building their own harness etc like pi etc so i think harness becomes mroe inprtant and to mainky test which ai models generally do better than other models when it ocmes to having harness etc
// as it also evaluates them in various aspects like tool calling , etc