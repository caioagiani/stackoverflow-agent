import { createInterface } from "node:readline/promises";
import { apiPost, apiGet } from "./client.js";
import { requireToken } from "./config.js";
import { decodeEntities } from "./html.js";

const args = process.argv.slice(2);
const id = args.find((a) => /^\d+$/.test(a));
const isQuestion = args.includes("--question");
const undo = args.includes("--undo");

if (!id) {
  console.error("uso: npm run vote -- <answer_id> [--question] [--undo] [--yes]");
  console.error("upvote exige 15 de reputação.");
  process.exit(1);
}

const kind = isQuestion ? "questions" : "answers";
const accessToken = requireToken();

const current = await apiGet(`${kind}/${id}`, { filter: "default" });
const post = current.items[0];
if (!post) {
  console.error("post não encontrado");
  process.exit(1);
}

console.log(`${isQuestion ? "pergunta" : "resposta"} ${id}`);
console.log(`score ${post.score}${post.is_accepted ? " · aceita" : ""} · ${decodeEntities(post.title || post.owner?.display_name || "")}`);
console.log(`${undo ? "REMOVER upvote" : "UPVOTE"}\n`);

if (!args.includes("--yes")) {
  if (!process.stdin.isTTY) {
    console.error("sem terminal interativo para confirmar. Repita com --yes.");
    process.exit(1);
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const confirm = await rl.question('digite "votar" para confirmar: ');
  rl.close();
  if (confirm.trim().toLowerCase() !== "votar") {
    console.log("cancelado");
    process.exit(0);
  }
}

try {
  const path = undo ? `${kind}/${id}/upvote/undo` : `${kind}/${id}/upvote`;
  const result = await apiPost(path, {}, accessToken);
  console.log(`ok · score agora ${result.items[0].score}`);
} catch (error) {
  console.error(`falhou: ${error.message}`);
  if (/no_privileges|reputation/i.test(error.message)) {
    console.error("upvote exige 15 de reputação; voto no próprio post não é permitido.");
  }
  process.exit(1);
}
