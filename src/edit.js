import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createInterface } from "node:readline/promises";
import { apiPost, apiGet } from "./client.js";
import { ROOT, requireToken } from "./config.js";
import { lint, report } from "./lint.js";
import { decodeEntities } from "./html.js";

const args = process.argv.slice(2);
function arg(name, fallback) {
  const index = args.indexOf(`--${name}`);
  if (index === -1) return fallback;
  // junta até a próxima flag: npm run pode desmontar aspas de valores com espaço
  const rest = [];
  for (let i = index + 1; i < args.length && !args[i].startsWith("--"); i++) rest.push(args[i]);
  return rest.length ? rest.join(" ") : fallback;
}

const target = args.find((a) => !a.startsWith("--") && /^\d+$/.test(a));
if (!target) {
  console.error('uso: npm run edit -- <answer_id> [--file caminho] [--comment "resumo"] [--preview] [--yes]');
  process.exit(1);
}

const log = existsSync(join(ROOT, "answers.jsonl"))
  ? readFileSync(join(ROOT, "answers.jsonl"), "utf8").split("\n").filter(Boolean).map((l) => JSON.parse(l))
  : [];
const entry = log.find((e) => String(e.answer_id) === target);

const file = arg("file", entry ? join(ROOT, "drafts", String(entry.question_id), "answer.md") : null);
if (!file || !existsSync(file)) {
  console.error(`rascunho não encontrado: ${file || "(sem --file e sem registro em answers.jsonl)"}`);
  process.exit(1);
}

const body = readFileSync(file, "utf8").trim();
const summary = arg("comment", "");

console.log(`resposta ${target} · ${body.length} chars · ${file}\n`);
const { blocked } = report(lint(body));
console.log("");

if (blocked && !args.includes("--force")) {
  console.error("bloqueado pelo lint. Reescreva.");
  process.exit(1);
}

const accessToken = requireToken();

const current = await apiGet(`answers/${target}`, { filter: "default" });
if (!current.items[0]) {
  console.error("resposta não encontrada");
  process.exit(1);
}
console.log(`score atual: ${current.items[0].score} · aceita: ${current.items[0].is_accepted}`);

if (args.includes("--preview")) {
  const result = await apiPost(
    `questions/${entry?.question_id ?? current.items[0].question_id}/answers/render`,
    { body, filter: "withbody" },
    accessToken,
  );
  console.log("\n--- preview ---\n");
  console.log(result.items[0].body);
  console.log("\nnada foi editado.");
  process.exit(0);
}

if (!args.includes("--yes")) {
  if (!process.stdin.isTTY) {
    console.error("\nsem terminal interativo para confirmar. Repita o comando com --yes.");
    process.exit(1);
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const confirm = await rl.question('digite "editar" para confirmar: ');
  rl.close();
  if (confirm.trim().toLowerCase() !== "editar") {
    console.log("cancelado");
    process.exit(0);
  }
}

try {
  const result = await apiPost(`answers/${target}/edit`, { body, comment: summary }, accessToken);
  const answer = result.items[0];
  console.log(`\neditada: ${decodeEntities(answer.link || `answer ${answer.answer_id}`)}`);
} catch (error) {
  console.error(`\nfalhou: ${error.message}`);
  process.exit(1);
}
