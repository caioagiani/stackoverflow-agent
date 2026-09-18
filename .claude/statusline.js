import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

let input = "";
process.stdin.on("data", (chunk) => (input += chunk));
process.stdin.on("end", () => {
  let model = "";
  try {
    model = JSON.parse(input)?.model?.display_name || "";
  } catch {}

  // Local files only: the statusline runs on every refresh and can't hit the API.
  let stats = "no answers";
  const timeline = join(ROOT, "TIMELINE.md");
  const log = join(ROOT, "answers.jsonl");

  if (existsSync(timeline)) {
    const match = readFileSync(timeline, "utf8").match(/(\d+) answer\(s\) · (\d+) accepted · total score (-?\d+)/);
    if (match) {
      const [, total, accepted, score] = match;
      stats = `${total} ans · ${accepted} accepted · score ${score}`;
    }
  } else if (existsSync(log)) {
    const count = readFileSync(log, "utf8").split("\n").filter(Boolean).length;
    stats = `${count} ans`;
  }

  const token = existsSync(join(ROOT, ".secrets", "token.json")) ? "auth ok" : "NO TOKEN";

  const dim = (s) => `\x1b[2m${s}\x1b[0m`;
  const orange = (s) => `\x1b[38;5;208m${s}\x1b[0m`;

  const parts = [orange("Stack Overflow Agent"), dim("node·php·py"), stats, dim(token)];
  if (model) parts.push(dim(model));

  process.stdout.write(parts.join(dim(" · ")));
});
