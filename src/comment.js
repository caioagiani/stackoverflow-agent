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
  console.error('uso: npm run comment -- <post_id> --body "texto" [--site stackapps] [--yes]');
  process.exit(1);
}

// Limites do próprio site: comentário tem 600 caracteres e exige 50 de reputação.
if (body.length > 600) {
  console.error(`comentário tem ${body.length} caracteres; o limite é 600`);
  process.exit(1);
}
if (body.length < 15) {
  console.error("comentário curto demais; o mínimo é 15 caracteres");
  process.exit(1);
}

const accessToken = requireToken();

console.log(`post ${postId} · ${site || "stackoverflow"} · ${body.length}/600 caracteres\n`);
console.log(body);
console.log("");

if (!args.includes("--yes")) {
  if (!process.stdin.isTTY) {
    console.error("sem terminal interativo para confirmar. Repita com --yes.");
    process.exit(1);
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const confirm = await rl.question('digite "comentar" para confirmar: ');
  rl.close();
  if (confirm.trim().toLowerCase() !== "comentar") {
    console.log("cancelado");
    process.exit(0);
  }
}

try {
  const result = await apiPost(`posts/${postId}/comments/add`, site ? { body, site } : { body }, accessToken);
  const comment = result.items[0];
  console.log(`\npublicado: comentário ${comment.comment_id}`);
  console.log(htmlToText(comment.body || body));
} catch (error) {
  console.error(`\nfalhou: ${error.message}`);
  if (/no_privileges|reputation/i.test(error.message)) {
    console.error("comentar em post de terceiros exige 50 de reputação.");
  }
  process.exit(1);
}
