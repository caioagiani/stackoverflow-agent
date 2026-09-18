import { createInterface } from "node:readline/promises";
import { apiPost, apiGet } from "./client.js";
import { requireToken } from "./config.js";
import { decodeEntities } from "./html.js";

const args = process.argv.slice(2);
const id = args.find((a) => /^\d+$/.test(a));
const isQuestion = args.includes("--question");
const undo = args.includes("--undo");

if (!id) {
  console.error("usage: npm run vote -- <answer_id> [--question] [--undo] [--yes]");
  console.error("an upvote needs 15 reputation.");
  process.exit(1);
}

const kind = isQuestion ? "questions" : "answers";
const accessToken = requireToken();

const current = await apiGet(`${kind}/${id}`, { filter: "default" });
const post = current.items[0];
if (!post) {
  console.error("post not found");
  process.exit(1);
}

console.log(`${isQuestion ? "question" : "answer"} ${id}`);
console.log(`score ${post.score}${post.is_accepted ? " · accepted" : ""} · ${decodeEntities(post.title || post.owner?.display_name || "")}`);
console.log(`${undo ? "REMOVE upvote" : "UPVOTE"}\n`);

if (!args.includes("--yes")) {
  if (!process.stdin.isTTY) {
    console.error("no interactive terminal to confirm in. repeat with --yes.");
    process.exit(1);
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const confirm = await rl.question('type "vote" to confirm: ');
  rl.close();
  if (confirm.trim().toLowerCase() !== "vote") {
    console.log("canceled");
    process.exit(0);
  }
}

try {
  const path = undo ? `${kind}/${id}/upvote/undo` : `${kind}/${id}/upvote`;
  const result = await apiPost(path, {}, accessToken);
  console.log(`ok · score now ${result.items[0].score}`);
} catch (error) {
  console.error(`failed: ${error.message}`);
  if (/no_privileges|reputation/i.test(error.message)) {
    console.error("an upvote needs 15 reputation; voting on your own post isn't allowed.");
  }
  process.exit(1);
}
