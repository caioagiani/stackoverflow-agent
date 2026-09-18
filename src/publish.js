import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { apiPost, apiGet } from "./client.js";
import { ROOT, requireToken, config } from "./config.js";
import { lint, report } from "./lint.js";
import { decodeEntities } from "./html.js";
import { recordAnswer } from "./timeline.js";

const args = process.argv.slice(2);
function arg(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
}

const target = args.find((a) => !a.startsWith("--") && !/^drafts\//.test(a));
const id = (String(target || "").match(/questions\/(\d+)/) || String(target || "").match(/^(\d+)$/) || [])[1];

if (!id) {
  console.error("usage: npm run publish -- <id> [--file path] [--preview] [--yes]");
  process.exit(1);
}

const file = arg("file", join(ROOT, "drafts", id, "answer.md"));
if (!existsSync(file)) {
  console.error(`draft not found: ${file}`);
  process.exit(1);
}

const body = readFileSync(file, "utf8").trim();
if (body.length < 30) {
  console.error("body too short; the API rejects anything under 30 characters");
  process.exit(1);
}

console.log(`question ${id} · ${body.length} chars · ${file}\n`);
const { blocked } = report(lint(body));
console.log("");

if (blocked && !args.includes("--force")) {
  console.error("blocked by lint. rewrite it, or run with --force if you disagree.");
  process.exit(1);
}

const accessToken = requireToken();

if (args.includes("--preview")) {
  const result = await apiPost(`questions/${id}/answers/render`, { body, filter: "withbody" }, accessToken);
  const rendered = result.items[0];
  console.log("--- preview rendered by Stack Overflow ---\n");
  console.log(rendered.body);
  console.log("\nnothing was posted. to post: npm run publish -- " + id);
  process.exit(0);
}

const question = await apiGet(`questions/${id}`, { filter: "default" });
const info = question.items[0];
if (!info) {
  console.error("question not found");
  process.exit(1);
}
if (info.closed_date) {
  console.error(`question is closed (${info.closed_reason || "no reason given"}). don't post.`);
  process.exit(1);
}

console.log(`title: ${decodeEntities(info.title)}`);
console.log(`link:  ${info.link}`);
console.log(`site:  ${config.site}\n`);

if (!args.includes("--yes")) {
  if (!process.stdin.isTTY) {
    console.error("\nno interactive terminal to confirm in. repeat the command with --yes.");
    process.exit(1);
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const confirm = await rl.question('type "publish" to confirm: ');
  rl.close();
  if (confirm.trim().toLowerCase() !== "publish") {
    console.log("canceled");
    process.exit(0);
  }
}

try {
  const result = await apiPost(`questions/${id}/answers/add`, { body }, accessToken);
  const answer = result.items[0];
  const record = {
    question_id: Number(id),
    answer_id: answer.answer_id,
    link: answer.link || `${info.link}#${answer.answer_id}`,
    posted_at: new Date().toISOString(),
  };
  writeFileSync(join(ROOT, "drafts", id, "posted.json"), JSON.stringify(record, null, 2));
  recordAnswer(record);
  console.log(`\nposted: ${record.link}`);
} catch (error) {
  console.error(`\nfailed: ${error.message}`);
  if (error.errorName === "bad_parameter" || /no_privileges|write/.test(error.message)) {
    console.error("check: the app needs a registered post on Stack Apps and write_access scope on the token.");
  }
  process.exit(1);
}
