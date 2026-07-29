import { execFileSync, execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";
import type { VerifierResult } from "../types";

function extractCode(raw: string): string {
  const fence = raw.match(/```(?:python|py)?\s*([\s\S]*?)```/);
  if (fence) return fence[1].trim();
  return raw.trim();
}

function buildHarness(code: string, tests: string[]): string {
  const escapedTests = JSON.stringify(tests);
  return `
import json, traceback

# --- model output ---
${code}
# --- end model output ---

tests = ${escapedTests}
passed = 0
results = []

for t in tests:
    try:
        exec(t, {"solution": solution})
        passed += 1
        results.append(f"PASS: {t}")
    except AssertionError:
        results.append(f"FAIL: {t}")
    except Exception as e:
        results.append(f"ERROR: {t} — {e}")

for r in results:
    print(r)

print(f"__SCORE__{passed}/{len(tests)}__SCORE__")
`;
}

function parseScore(output: string, total: number): { passed: number; total: number } {
  const match = output.match(/__SCORE__(\d+)\/(\d+)__SCORE__/);
  if (match) return { passed: parseInt(match[1]), total: parseInt(match[2]) };
  return { passed: 0, total };
}

function dockerAvailable(): boolean {
  try {
    execSync("docker info", { stdio: "ignore", timeout: 3_000 });
    return true;
  } catch {
    return false;
  }
}

function localPython(): string | null {
  for (const bin of ["python3", "python"]) {
    try {
      execFileSync(bin, ["--version"], { stdio: "ignore", timeout: 3_000 });
      return bin;
    } catch {
      /* try next */
    }
  }
  return null;
}

function scoreFromStdout(stdout: string, testList: string[]): VerifierResult {
  const { passed, total } = parseScore(stdout, testList.length);
  const score = total > 0 ? Math.round((passed / total) * 100) : 0;
  const allPassed = passed === total;
  const lines = stdout
    .split("\n")
    .filter((l) => l.startsWith("PASS") || l.startsWith("FAIL") || l.startsWith("ERROR"))
    .join("\n");
  return {
    passed: allPassed,
    score,
    details: `${passed}/${total} tests passed\n${lines}`,
  };
}

function runLocalPython(scriptPath: string, testList: string[], note: string): VerifierResult | null {
  const py = localPython();
  if (!py) return null;
  const stdout = execFileSync(py, [scriptPath], {
    timeout: 10_000,
    env: { ...process.env, PYTHONDONTWRITEBYTECODE: "1" },
  }).toString();
  const scored = scoreFromStdout(stdout, testList);
  return {
    ...scored,
    details: `${scored.details}\n(${note})`,
  };
}

export function verifyCodeExec(rawOutput: string, tests: unknown[]): VerifierResult {
  const testList = (tests as string[]).filter((t) => typeof t === "string");
  if (testList.length === 0) {
    return { passed: false, score: 0, details: "no test cases provided" };
  }

  const code = extractCode(rawOutput);
  if (!code) {
    return { passed: false, score: 0, details: "no code found in output" };
  }

  const tmpdir = os.tmpdir();
  const scriptDir = fs.mkdtempSync(path.join(tmpdir, "slopmark-"));
  const scriptPath = path.join(scriptDir, "main.py");
  fs.writeFileSync(scriptPath, buildHarness(code, testList));

  try {
    if (dockerAvailable()) {
      try {
        const cmd = `docker run --rm --network none --memory 128m --cpus 0.5 -v ${scriptDir}:/code python:3.9-slim python /code/main.py`;
        const stdout = execSync(cmd, { timeout: 10_000 }).toString();
        return scoreFromStdout(stdout, testList);
      } catch (dockerErr: unknown) {
        const err = dockerErr as { stdout?: Buffer; stderr?: Buffer; message?: string };
        const out = err.stdout?.toString() ?? "";
        const { passed, total } = parseScore(out, testList.length);
        // real test output from inside the container — keep it
        if (total > 0 && (passed > 0 || out.includes("FAIL") || out.includes("ERROR"))) {
          const score = Math.round((passed / total) * 100);
          return {
            passed: false,
            score,
            details: `${passed}/${total} tests passed before error\n${out}`,
          };
        }
        // docker itself failed (image/mount) — fall through to local python
        const local = runLocalPython(
          scriptPath,
          testList,
          `sandbox: local python — docker run failed: ${(err.message ?? "unknown").slice(0, 120)}`,
        );
        if (local) return local;
        throw dockerErr;
      }
    }

    const local = runLocalPython(scriptPath, testList, "sandbox: local python — docker unavailable");
    if (local) return local;

    return {
      passed: false,
      score: 0,
      details:
        "code_exec skipped — docker and local python unavailable (typical on serverless). run locally with docker or python to score coding/swe tasks.",
    };
  } catch (e: unknown) {
    const err = e as { stdout?: Buffer; stderr?: Buffer; message?: string };
    const out = err.stdout?.toString() ?? "";
    const errText = err.stderr?.toString() ?? err.message ?? "";

    const { passed, total } = parseScore(out, testList.length);
    if (total > 0 && passed > 0) {
      const score = Math.round((passed / total) * 100);
      return { passed: false, score, details: `${passed}/${total} tests passed before error\n${out}` };
    }

    return {
      passed: false,
      score: 0,
      details: `execution failed\n${out}\n${errText}`.trim(),
    };
  } finally {
    fs.rmSync(scriptDir, { recursive: true, force: true });
  }
}
