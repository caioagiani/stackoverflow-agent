import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { apiGet, markdownFilter, commentFilter } from "./client.js";
import { ROOT } from "./config.js";
import { decodeEntities, htmlToText } from "./html.js";

const args = process.argv.slice(2);
const target = args.find((a) => !a.startsWith("--"));

if (!target) {
  console.error("usage: npm run question -- <id or url>");
  process.exit(1);
}

const id = (target.match(/questions\/(\d+)/) || target.match(/^(\d+)$/) || [])[1];
if (!id) {
  console.error("couldn't pull a question id out of that");
  process.exit(1);
}

function when(timestamp) {
  return new Date(timestamp * 1000).toISOString().slice(0, 10);
}

function comments(list = []) {
  if (!list.length) return "";
  return (
    "\n" +
    list
      .map((c) => `> [comment +${c.score}] ${c.owner?.display_name || "?"}: ${htmlToText(c.body)}`)
      .join("\n")
  );
}

const filter = await markdownFilter();
const result = await apiGet(`questions/${id}`, { filter });
const question = result.items[0];

if (!question) {
  console.error("question not found");
  process.exit(1);
}

const answers = question.answers || [];
const cFilter = await commentFilter();
const byPost = new Map();
for (const list of await Promise.all([
  apiGet(`questions/${id}/comments`, { filter: cFilter, pagesize: 100 }),
  answers.length
    ? apiGet(`answers/${answers.map((a) => a.answer_id).join(";")}/comments`, { filter: cFilter, pagesize: 100 })
    : Promise.resolve({ items: [] }),
])) {
  for (const comment of list.items || []) {
    if (!byPost.has(comment.post_id)) byPost.set(comment.post_id, []);
    byPost.get(comment.post_id).push(comment);
  }
}

const lines = [];
lines.push(`# ${decodeEntities(question.title)}`);
lines.push("");
lines.push(
  `id ${question.question_id} · ${question.tags.join(", ")} · score ${question.score} · ${question.view_count} views · ${when(question.creation_date)}`,
);
lines.push(`author: ${question.owner?.display_name || "?"} (${question.owner?.reputation ?? 0} rep)`);
lines.push(question.link);
if (question.closed_date) lines.push(`**CLOSED** on ${when(question.closed_date)}: ${question.closed_reason || ""}`);
if (question.close_vote_count) lines.push(`close votes: ${question.close_vote_count}`);
lines.push("");
lines.push("---");
lines.push("");
lines.push(decodeEntities(question.body_markdown));
lines.push(comments(byPost.get(question.question_id)));

lines.push("");
lines.push(`---`);
lines.push("");
lines.push(`## ${answers.length} existing answer(s)`);
for (const answer of answers) {
  lines.push("");
  lines.push(
    `### answer ${answer.answer_id} · score ${answer.score}${answer.is_accepted ? " · ACCEPTED" : ""} · ${answer.owner?.display_name || "?"}`,
  );
  lines.push("");
  lines.push(decodeEntities(answer.body_markdown));
  lines.push(comments(byPost.get(answer.answer_id)));
}

const markdown = lines.join("\n");
const dir = join(ROOT, "drafts", id);
mkdirSync(dir, { recursive: true });
writeFileSync(join(dir, "question.md"), markdown);

console.log(markdown);
console.error(`\n---\nsaved to drafts/${id}/question.md`);
console.error(`draft it in drafts/${id}/answer.md and run: npm run publish -- ${id} --preview`);
