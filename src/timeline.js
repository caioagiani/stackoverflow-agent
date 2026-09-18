import { readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { join } from "node:path";
import { apiGet } from "./client.js";
import { ROOT } from "./config.js";
import { decodeEntities } from "./html.js";

const LOG = join(ROOT, "answers.jsonl");
const OUT = join(ROOT, "TIMELINE.md");

export function recordAnswer(entry) {
  appendFileSync(LOG, JSON.stringify(entry) + "\n");
}

function readLog() {
  if (!existsSync(LOG)) return [];
  return readFileSync(LOG, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function day(iso) {
  return iso.slice(0, 10);
}

async function run() {
  const entries = readLog();
  if (!entries.length) {
    console.log("Nada publicado ainda.");
    return;
  }

  const ids = entries.map((e) => e.answer_id);
  const [answers, questions] = await Promise.all([
    apiGet(`answers/${ids.join(";")}`, { filter: "default", pagesize: 100 }),
    apiGet(`questions/${entries.map((e) => e.question_id).join(";")}`, { filter: "default", pagesize: 100 }),
  ]);

  const byAnswer = new Map(answers.items.map((a) => [a.answer_id, a]));
  const byQuestion = new Map(questions.items.map((q) => [q.question_id, q]));

  const rows = entries
    .slice()
    .sort((a, b) => b.posted_at.localeCompare(a.posted_at))
    .map((entry) => {
      const answer = byAnswer.get(entry.answer_id);
      const question = byQuestion.get(entry.question_id);
      return {
        ...entry,
        title: question ? decodeEntities(question.title) : "(pergunta removida)",
        tags: question?.tags?.join(", ") || "",
        score: answer?.score ?? null,
        accepted: answer?.is_accepted ?? false,
        deleted: !answer,
      };
    });

  const accepted = rows.filter((r) => r.accepted).length;
  const totalScore = rows.reduce((sum, r) => sum + (r.score || 0), 0);

  const lines = [
    "# Respostas publicadas",
    "",
    `${rows.length} resposta(s) · ${accepted} aceita(s) · score somado ${totalScore}`,
    "",
    "Gerado por `npm run timeline`. Scores são consultados na API a cada execução.",
    "",
  ];

  let lastDay = null;
  for (const row of rows) {
    if (day(row.posted_at) !== lastDay) {
      lastDay = day(row.posted_at);
      lines.push(`## ${lastDay}`, "");
    }
    const marks = [
      row.deleted ? "APAGADA" : `score ${row.score}`,
      row.accepted ? "aceita" : null,
    ].filter(Boolean);
    lines.push(`- **${row.title}**  `);
    lines.push(`  ${row.tags} · ${marks.join(" · ")} · [resposta](${row.link})`);
    lines.push("");
  }

  writeFileSync(OUT, lines.join("\n"));
  console.log(lines.join("\n"));
  console.error(`\n---\nescrito em TIMELINE.md`);
}

if (import.meta.url === `file://${process.argv[1]}`) await run();
