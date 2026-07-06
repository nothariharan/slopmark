import fs from "fs";
import path from "path";
import crypto from "crypto";

const root = path.join(process.cwd(), "data", "tasks");

export function taskPoolVersion(): string {
  try {
    const files = fs.readdirSync(root).filter((f) => f.endsWith(".json"));
    const hash = crypto.createHash("sha256");
    for (const f of files.sort()) {
      hash.update(f);
      hash.update(fs.readFileSync(path.join(root, f)));
    }
    return hash.digest("hex").slice(0, 12);
  } catch {
    return "unknown";
  }
}
