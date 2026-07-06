import type { BenchTask, VerifierConfig } from "../../types";

export type ProceduralTemplate =
  | "direction-easy"
  | "direction-hard"
  | "sequence"
  | "time"
  | "calendar-easy"
  | "calendar-medium"
  | "calendar-hard"
  | "palindrome";

export const PROCEDURAL_TEMPLATES: { id: ProceduralTemplate; difficulty: "easy" | "medium" | "hard"; seeds: number }[] = [
  { id: "direction-easy", difficulty: "easy", seeds: 8 },
  { id: "direction-hard", difficulty: "hard", seeds: 8 },
  { id: "sequence", difficulty: "medium", seeds: 10 },
  { id: "time", difficulty: "medium", seeds: 10 },
  { id: "calendar-easy", difficulty: "easy", seeds: 8 },
  { id: "calendar-medium", difficulty: "medium", seeds: 8 },
  { id: "calendar-hard", difficulty: "hard", seeds: 8 },
  { id: "palindrome", difficulty: "easy", seeds: 15 },
];

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type CompassDir = "north" | "east" | "south" | "west";
const COMPASS: CompassDir[] = ["north", "east", "south", "west"];

function applyTurn(dir: CompassDir, turn: "left" | "right"): CompassDir {
  const i = COMPASS.indexOf(dir);
  return turn === "right" ? COMPASS[(i + 1) % 4] : COMPASS[(i + 3) % 4];
}

function makeDirection(numTurns: number, rnd: () => number) {
  const start = COMPASS[Math.floor(rnd() * 4)];
  const turns: ("left" | "right")[] = Array.from({ length: numTurns }, () =>
    rnd() > 0.5 ? "right" : "left",
  );
  let current = start;
  for (const t of turns) current = applyTurn(current, t);
  const list =
    numTurns === 1
      ? `turn ${turns[0]}`
      : turns.slice(0, -1).map((t) => `turn ${t}`).join(", ") + `, then turn ${turns[turns.length - 1]}`;
  return {
    prompt: `You are standing facing ${start}. You ${list}. What direction are you now facing? Answer with one word only: north, east, south, or west.`,
    expected: current,
    mode: "contains" as const,
  };
}

function makeSequence(rnd: () => number) {
  const r = rnd();
  let terms: number[];
  let answer: number;

  if (r < 0.25) {
    const step = Math.floor(rnd() * 6) + 2;
    const start = Math.floor(rnd() * 8) + 1;
    const all = Array.from({ length: 6 }, (_, i) => start + i * step);
    terms = all.slice(0, 5);
    answer = all[5];
  } else if (r < 0.5) {
    const start = Math.floor(rnd() * 3) + 1;
    const all = Array.from({ length: 6 }, (_, i) => start * Math.pow(2, i));
    terms = all.slice(0, 5);
    answer = all[5];
  } else if (r < 0.75) {
    const offset = Math.floor(rnd() * 4);
    const all = Array.from({ length: 6 }, (_, i) => Math.pow(i + 1 + offset, 2));
    terms = all.slice(0, 5);
    answer = all[5];
  } else {
    const fa = Math.floor(rnd() * 4) + 1;
    const fb = Math.floor(rnd() * 4) + 2;
    terms = [fa, fb];
    while (terms.length < 6) terms.push(terms[terms.length - 1] + terms[terms.length - 2]);
    answer = terms[5];
    terms = terms.slice(0, 5);
  }

  return {
    prompt: `What is the next number in this sequence? Output only the number, nothing else.\n\n${terms.join(", ")}, ?`,
    expected: String(answer),
    mode: "exact_number" as const,
  };
}

type TimeResult = { h: number; m: number; ampm: "AM" | "PM" };

function computeAddTime(startH: number, startM: number, startAmPm: "AM" | "PM", addH: number, addM: number): TimeResult {
  const startH24 = startAmPm === "AM" ? startH % 12 : (startH % 12) + 12;
  let totalMins = startH24 * 60 + startM + addH * 60 + addM;
  totalMins = totalMins % (24 * 60);
  const h24 = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const ampm: "AM" | "PM" = h24 < 12 ? "AM" : "PM";
  const h = h24 % 12 === 0 ? 12 : h24 % 12;
  return { h, m, ampm };
}

function formatTime(t: TimeResult): string {
  return `${t.h}:${String(t.m).padStart(2, "0")} ${t.ampm}`;
}

function makeTime(rnd: () => number) {
  const startH = Math.floor(rnd() * 11) + 1;
  const startM = [0, 15, 30, 45][Math.floor(rnd() * 4)];
  const startAmPm: "AM" | "PM" = rnd() > 0.5 ? "AM" : "PM";
  const addH = Math.floor(rnd() * 4) + 1;
  const addM = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50][Math.floor(rnd() * 10)];
  const answer = computeAddTime(startH, startM, startAmPm, addH, addM);
  const startStr = `${startH}:${String(startM).padStart(2, "0")} ${startAmPm}`;
  const addStr = `${addH} hour${addH !== 1 ? "s" : ""} and ${addM} minutes`;
  return {
    prompt: `The time is ${startStr}. You add ${addStr}. What time is it now? Answer in this exact format: H:MM AM or H:MM PM (example: 3:45 PM).`,
    expected: formatTime(answer),
    mode: "time" as const,
  };
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function makeCalendar(minDays: number, maxDays: number, rnd: () => number) {
  const startDayIdx = Math.floor(rnd() * 7);
  const days = Math.floor(rnd() * (maxDays - minDays + 1)) + minDays;
  const endDayIdx = (startDayIdx + days) % 7;
  return {
    prompt: `If today is ${DAY_NAMES[startDayIdx]}, what day of the week will it be in exactly ${days} days? Answer with just the day name.`,
    expected: DAY_NAMES[endDayIdx].toLowerCase(),
    mode: "contains" as const,
  };
}

const PALINDROME_TASKS = [
  { text: "racecar", isPalindrome: true },
  { text: "level", isPalindrome: true },
  { text: "hello", isPalindrome: false },
  { text: "deified", isPalindrome: true },
  { text: "kayak", isPalindrome: true },
  { text: "kayaks", isPalindrome: false },
  { text: "refer", isPalindrome: true },
  { text: "defied", isPalindrome: false },
  { text: "civic", isPalindrome: true },
  { text: "aibohphobia", isPalindrome: true },
  { text: "rotator", isPalindrome: true },
  { text: "stressed", isPalindrome: false },
  { text: "noon", isPalindrome: true },
  { text: "almost", isPalindrome: false },
  { text: "repaper", isPalindrome: true },
];

function makePalindrome(seed: number) {
  const t = PALINDROME_TASKS[seed % PALINDROME_TASKS.length];
  return {
    prompt: `Is "${t.text}" a palindrome? Answer with only "yes" or "no".`,
    expected: t.isPalindrome ? "yes" : "no",
    mode: "yes_no" as const,
  };
}

function generateBody(template: ProceduralTemplate, seed: number) {
  const rnd = mulberry32(seed);
  switch (template) {
    case "direction-easy":
      return makeDirection(3, rnd);
    case "direction-hard":
      return makeDirection(8, rnd);
    case "sequence":
      return makeSequence(rnd);
    case "time":
      return makeTime(rnd);
    case "calendar-easy":
      return makeCalendar(7, 30, rnd);
    case "calendar-medium":
      return makeCalendar(31, 100, rnd);
    case "calendar-hard":
      return makeCalendar(101, 400, rnd);
    case "palindrome":
      return makePalindrome(seed);
  }
}

export function proceduralTaskId(template: ProceduralTemplate, seed: number) {
  return `proc-${template}-${seed}`;
}

export function parseProceduralId(id: string): { template: ProceduralTemplate; seed: number } | null {
  if (!id.startsWith("proc-")) return null;
  const rest = id.slice(5);
  const lastDash = rest.lastIndexOf("-");
  if (lastDash <= 0) return null;
  const template = rest.slice(0, lastDash) as ProceduralTemplate;
  const seed = parseInt(rest.slice(lastDash + 1), 10);
  if (!PROCEDURAL_TEMPLATES.some((t) => t.id === template) || isNaN(seed)) return null;
  return { template, seed };
}

export function generateProceduralTask(template: ProceduralTemplate, seed: number): BenchTask {
  const meta = PROCEDURAL_TEMPLATES.find((t) => t.id === template)!;
  const body = generateBody(template, seed);
  const verifier: VerifierConfig = {
    type: "procedural_answer",
    expected: body.expected,
    mode: body.mode,
  };
  return {
    id: proceduralTaskId(template, seed),
    domain: "procedural",
    prompt: body.prompt,
    verifier,
    source: "seed",
    approved: true,
    difficulty: meta.difficulty,
    template_id: template,
  };
}

export function listProceduralTasks(): BenchTask[] {
  const out: BenchTask[] = [];
  for (const t of PROCEDURAL_TEMPLATES) {
    for (let s = 0; s < t.seeds; s++) {
      out.push(generateProceduralTask(t.id, s + 1));
    }
  }
  return out;
}

export function resolveProceduralTask(id: string): BenchTask | null {
  const parsed = parseProceduralId(id);
  if (!parsed) return null;
  return generateProceduralTask(parsed.template, parsed.seed);
}
