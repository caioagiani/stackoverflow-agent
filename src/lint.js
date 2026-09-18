// Detector de "cheiro de LLM". Roda antes de qualquer publicação.
// Regra do projeto: se soa como resposta de IA, não sai.

const BLOCK = [
  [/\b(i )?hope (this|that) helps\b/i, "fecho de chatbot"],
  [/\bgreat question\b/i, "puxada de saco de chatbot"],
  [/\blet me know if\b/i, "fecho de chatbot"],
  [/\bfeel free to\b/i, "fecho de chatbot"],
  [/\bit'?s (important|worth) (to note|noting)\b/i, "hedge de LLM"],
  [/\bplease note that\b/i, "hedge de LLM"],
  [/\bkeep in mind that\b/i, "hedge de LLM"],
  [/\bin (summary|conclusion)\b/i, "resumo final desnecessário"],
  [/\bto summari[sz]e\b/i, "resumo final desnecessário"],
  [/\bas an ai\b/i, "vazamento de IA"],
  [/\bcertainly[,!]/i, "abertura de chatbot"],
  [/\b(here'?s|below is) a (breakdown|step-by-step|detailed)\b/i, "estrutura de LLM"],
  [/\blet'?s (break|dive|walk) (this |it )?(down|into|through)\b/i, "estrutura de LLM"],
  [/\bi understand (that )?you'?re\b/i, "eco do enunciado"],
  [/[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}]/u, "emoji"],
];

const WARN = [
  // Experiência fabricada: o agente não viveu nada. Só vale contar o que rodou agora.
  [/\bin my (experience|production|setup|case)\b/i, "experiência fabricada; diga o que você testou agora"],
  [/\bi('ve| have) (seen|run into|hit|had) this\b/i, "experiência fabricada"],
  [/\bwe (use|ran|had) this in production\b/i, "experiência fabricada"],
  [/\bat my (job|company|work)\b/i, "experiência fabricada"],
  [/\blast (year|month|week) i\b/i, "experiência fabricada"],
  // Hedge e catálogo: LLM lista tudo em vez de escolher
  [/\bthere are (several|many|multiple|a few) ways\b/i, "escolha uma e defenda"],
  [/\byou (might|may) want to consider\b/i, "hedge; diga o que fazer"],
  [/\bone option would be\b/i, "hedge; diga o que fazer"],
  [/\bit depends on your (use case|needs|requirements)\b/i, "vago; diga de que depende"],
  [/\bdelve\b/i, "palavra-marca de LLM"],
  [/\bleverag(e|ing)\b/i, "palavra-marca de LLM"],
  [/\butiliz(e|ing)\b/i, 'prefira "use"'],
  [/\bseamless(ly)?\b/i, "palavra-marca de LLM"],
  [/\bplethora\b/i, "palavra-marca de LLM"],
  [/\brobust\b/i, "palavra-marca de LLM"],
  [/\bcomprehensive\b/i, "palavra-marca de LLM"],
  [/^(furthermore|moreover|additionally)[,]/im, "conector de LLM no início de frase"],
  [/\bthis should (work|fix|solve|do)\b/i, "chute sem explicação"],
  [/\btry the following\b/i, "genérico"],
  [/\byou can simply\b/i, 'condescendente; corte o "simply"'],
  [/^[-*]\s+\*\*[^*]+\*\*\s*:/m, "bullet com negrito na frente: assinatura de LLM"],
  [/\bin the world of\b/i, "abertura de blog"],
  [/\bby following these steps\b/i, "fecho de tutorial"],
];

export function lint(text) {
  const findings = [];

  for (const [pattern, why] of BLOCK) {
    const hit = text.match(pattern);
    if (hit) findings.push({ level: "block", match: hit[0].trim(), why });
  }
  for (const [pattern, why] of WARN) {
    const hit = text.match(pattern);
    if (hit) findings.push({ level: "warn", match: hit[0].trim(), why });
  }

  const headers = (text.match(/^#{1,6}\s/gm) || []).length;
  if (headers > 2) {
    findings.push({ level: "warn", match: `${headers} headers`, why: "resposta de SO raramente precisa de seções" });
  }

  const body = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
  if (body.length > 600 && !/\b\w+'(t|s|re|ll|ve|m|d)\b/i.test(body)) {
    findings.push({
      level: "warn",
      match: "zero contrações",
      why: "formalidade uniforme soa a máquina; use don't, it's, you're",
    });
  }

  const sentences = body.split(/[.!?]\s+/).map((s) => s.trim().length).filter((n) => n > 20);
  if (sentences.length >= 5) {
    const mean = sentences.reduce((a, b) => a + b, 0) / sentences.length;
    const variance = sentences.reduce((a, b) => a + (b - mean) ** 2, 0) / sentences.length;
    if (Math.sqrt(variance) < 14) {
      findings.push({
        level: "warn",
        match: `desvio ${Math.round(Math.sqrt(variance))}`,
        why: "frases todas do mesmo tamanho; varie o ritmo",
      });
    }
  }

  if (body.length > 2200) {
    findings.push({ level: "warn", match: `${body.length} chars de prosa`, why: "longo demais, corte" });
  }
  if (text.trim().length < 120) {
    findings.push({ level: "warn", match: "muito curta", why: "risco de ser sinalizada como low quality" });
  }

  return findings;
}

export function report(findings) {
  if (!findings.length) {
    console.log("lint: limpo");
    return { blocked: false };
  }
  for (const f of findings) {
    const tag = f.level === "block" ? "BLOQUEIO" : "aviso   ";
    console.log(`${tag} "${f.match}" — ${f.why}`);
  }
  return { blocked: findings.some((f) => f.level === "block") };
}
