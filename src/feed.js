import { apiGet } from "./client.js";
import { config } from "./config.js";

const args = process.argv.slice(2);
function arg(name, fallback) {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? fallback : args[index + 1];
}

// O volume do SO caiu muito: node.js sozinho rende ~2 perguntas/dia. Janela curta devolve lista vazia.
const DEFAULT_TAGS = "node.js,php,python,javascript,typescript,express,laravel,django,flask,pandas";
const tags = (arg("tags", DEFAULT_TAGS) || "").split(",").map((t) => t.trim()).filter(Boolean);
const hours = Number(arg("hours", 72));
const max = Number(arg("max", 12));
const search = arg("search", null);
const onlyUnanswered = args.includes("--unanswered");

function age(createdAt) {
  const minutes = Math.floor((Date.now() / 1000 - createdAt) / 60);
  if (minutes < 60) return `${minutes}m`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h`;
  return `${Math.floor(minutes / 1440)}d`;
}

function decode(text) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function fetchTag(tag) {
  const params = {
    order: "desc",
    sort: "creation",
    tagged: tag,
    fromdate: Math.floor(Date.now() / 1000) - hours * 3600,
    pagesize: 100,
    filter: "default",
  };
  const path = onlyUnanswered ? "questions/unanswered" : "questions";
  const result = await apiGet(path, params);
  return result.items || [];
}

async function run() {
  let items = [];
  if (search) {
    const result = await apiGet("search/advanced", {
      order: "desc",
      sort: "creation",
      q: search,
      pagesize: 50,
      filter: "default",
    });
    items = result.items || [];
  } else {
    const batches = await Promise.all(tags.map(fetchTag));
    const seen = new Set();
    for (const batch of batches) {
      for (const question of batch) {
        if (seen.has(question.question_id)) continue;
        seen.add(question.question_id);
        items.push(question);
      }
    }
  }

  const candidates = items
    .filter((q) => !q.closed_date && q.answer_count < 4)
    .sort((a, b) => b.view_count / (b.answer_count + 1) - a.view_count / (a.answer_count + 1))
    .slice(0, max);

  if (!candidates.length) {
    console.log("Nada nesse recorte. Aumente --hours ou troque as tags.");
    return;
  }

  // Quem já tem resposta boa não precisa de outra. Precisa, no máximo, de um upvote.
  const withAnswers = candidates.filter((q) => q.answer_count > 0).map((q) => q.question_id);
  const best = new Map();
  if (withAnswers.length) {
    const result = await apiGet(`questions/${withAnswers.join(";")}/answers`, {
      filter: "default",
      pagesize: 100,
      sort: "votes",
      order: "desc",
    });
    for (const answer of result.items || []) {
      const current = best.get(answer.question_id);
      if (!current || answer.score > current.score || answer.is_accepted) {
        best.set(answer.question_id, {
          score: Math.max(answer.score, current?.score ?? -99),
          accepted: current?.accepted || answer.is_accepted,
          answer_id: answer.is_accepted ? answer.answer_id : (current?.answer_id ?? answer.answer_id),
        });
      }
    }
  }

  function coverage(q) {
    if (!q.answer_count) return { tag: "LIVRE", hint: "ninguém respondeu" };
    const top = best.get(q.question_id);
    if (!top) return { tag: "?", hint: "" };
    if (top.accepted) return { tag: "COBERTA", hint: `resposta aceita (${top.answer_id}) — só responda se ela estiver errada` };
    if (top.score >= 2) return { tag: "COBERTA", hint: `resposta com +${top.score} (${top.answer_id}) — considere upvote + comentário` };
    return { tag: "FRACA", hint: `melhor resposta com ${top.score} (${top.answer_id})` };
  }

  console.log(`${candidates.length} perguntas · site ${config.site} · últimas ${hours}h\n`);
  for (const q of candidates) {
    const { tag, hint } = coverage(q);
    console.log(`[${q.question_id}] ${tag.padEnd(7)} ${decode(q.title)}`);
    console.log(
      `   ${q.tags.join(" ")} · ${q.answer_count} resp · ${q.view_count} views · ${age(q.creation_date)} · score ${q.score}`,
    );
    if (hint) console.log(`   ${hint}`);
    console.log(`   ${q.link}\n`);
  }
  console.log(`Detalhar: npm run question -- <id>`);
}

await run();
