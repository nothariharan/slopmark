export const harnessVersion = "v0";

import type { HarnessMode } from "./types";

export const sysPrompt =
  "Follow the user instructions exactly. Output only what is asked, no preamble.";

/** zero context: no persona, no helpful-assistant framing, no extra rules */
export const zeroContextPrompt = "";

export const maxTok = 600;
export const temp = 0;

export function systemPromptFor(mode: HarnessMode): string {
  return mode === "zero_context" ? zeroContextPrompt : sysPrompt;
}

export function harnessLabel(mode: HarnessMode): string {
  return mode === "zero_context" ? `${harnessVersion}:zero_context` : harnessVersion;
}
