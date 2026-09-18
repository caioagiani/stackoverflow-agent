import { createInterface } from "node:readline/promises";
import { apiPost, apiGet } from "./client.js";
import { requireToken } from "./config.js";
import { htmlToText } from "./html.js";

const args = process.argv.slice(2);
const postId = args.find((a) => /^\d+$/.test(a));

function arg(name) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return null;
  const rest = [];
  for (let i = index + 1; i < args.length && !args[i].startsWith("--"); i++) rest.push(args[i]);
  return rest.join(" ") || null;
}

const body = arg("body");
const site = arg("site");
if (!postId || !body) {
  console.error('usage: npm run comment -- <post_id> --body "text" [--site stackapps] [--yes]');
  process.exit(1);
}

// The site's own limits: a comment caps at 600 characters and needs 50 reputation.
if (body.length > 600) {
  console.error(`comment is ${body.length} characters; the limit is 600`);
  process.exit(1);
}
if (body.length < 15) {
  console.error("comment too short; the minimum is 15 characters");
  process.exit(1);
}

const accessToken = requireToken();

console.log(`post ${postId} · ${site || "stackoverflow"} · ${body.length}/600 characters\n`);
console.log(body);
console.log("");

if (!args.includes("--yes")) {
  if (!process.stdin.isTTY) {
    console.error("no interactive terminal to confirm in. repeat with --yes.");
    process.exit(1);
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const confirm = await rl.question('type "comment" to confirm: ');
  rl.close();
  if (confirm.trim().toLowerCase() !== "comment") {
    console.log("canceled");
    process.exit(0);
  }
}

try {
  const result = await apiPost(`posts/${postId}/comments/add`, site ? { body, site } : { body }, accessToken);
  const comment = result.items[0];
  console.log(`\nposted: comment ${comment.comment_id}`);
  console.log(htmlToText(comment.body || body));
} catch (error) {
  console.error(`\nfailed: ${error.message}`);
  if (/no_privileges|reputation/i.test(error.message)) {
    console.error("commenting on someone else's post needs 50 reputation.");
  }
  process.exit(1);
}
