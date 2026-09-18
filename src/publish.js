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
  console.error("uso: npm run publish -- <id> [--file caminho] [--preview] [--yes]");
  process.exit(1);
}

const file = arg("file", join(ROOT, "drafts", id, "answer.md"));
if (!existsSync(file)) {
  console.error(`rascunho não encontrado: ${file}`);
  process.exit(1);
}

const body = readFileSync(file, "utf8").trim();
if (body.length < 30) {
  console.error("corpo curto demais; a API rejeita abaixo de 30 caracteres");
  process.exit(1);
}

console.log(`pergunta ${id} · ${body.length} chars · ${file}\n`);
const { blocked } = report(lint(body));
console.log("");

if (blocked && !args.includes("--force")) {
  console.error("bloqueado pelo lint. Reescreva ou rode com --force se discordar.");
  process.exit(1);
}

const accessToken = requireToken();

if (args.includes("--preview")) {
  const result = await apiPost(`questions/${id}/answers/render`, { body, filter: "withbody" }, accessToken);
  const rendered = result.items[0];
  console.log("--- preview renderizado pelo Stack Overflow ---\n");
  console.log(rendered.body);
  console.log("\nnada foi publicado. Para publicar: npm run publish -- " + id);
  process.exit(0);
}

const question = await apiGet(`questions/${id}`, { filter: "default" });
const info = question.items[0];
if (!info) {
  console.error("pergunta não encontrada");
  process.exit(1);
}
if (info.closed_date) {
  console.error(`pergunta fechada (${info.closed_reason || "sem motivo"}). Não publique.`);
  process.exit(1);
}

console.log(`título: ${decodeEntities(info.title)}`);
console.log(`link:   ${info.link}`);
console.log(`site:   ${config.site}\n`);

if (!args.includes("--yes")) {
  if (!process.stdin.isTTY) {
    console.error("\nsem terminal interativo para confirmar. Repita o comando com --yes.");
    process.exit(1);
  }
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const confirm = await rl.question('digite "publicar" para confirmar: ');
  rl.close();
  if (confirm.trim().toLowerCase() !== "publicar") {
    console.log("cancelado");
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
  console.log(`\npublicado: ${record.link}`);
} catch (error) {
  console.error(`\nfalhou: ${error.message}`);
  if (error.errorName === "bad_parameter" || /no_privileges|write/.test(error.message)) {
    console.error("checagem: app precisa de post registrado no Stack Apps e scope write_access no token.");
  }
  process.exit(1);
}
