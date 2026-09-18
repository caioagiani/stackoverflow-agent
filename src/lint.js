// "LLM smell" detector. Runs before anything gets published.
// Project rule: if it sounds like an AI answer, it doesn't ship.

const BLOCK = [
  [/\b(i )?hope (this|that) helps\b/i, "chatbot sign-off"],
  [/\bgreat question\b/i, "chatbot flattery"],
  [/\blet me know if\b/i, "chatbot sign-off"],
  [/\bfeel free to\b/i, "chatbot sign-off"],
  [/\bit'?s (important|worth) (to note|noting)\b/i, "LLM hedge"],
  [/\bplease note that\b/i, "LLM hedge"],
  [/\bkeep in mind that\b/i, "LLM hedge"],
  [/\bin (summary|conclusion)\b/i, "needless closing summary"],
  [/\bto summari[sz]e\b/i, "needless closing summary"],
  [/\bas an ai\b/i, "AI leak"],
  [/\bcertainly[,!]/i, "chatbot opener"],
  [/\b(here'?s|below is) a (breakdown|step-by-step|detailed)\b/i, "LLM scaffolding"],
  [/\blet'?s (break|dive|walk) (this |it )?(down|into|through)\b/i, "LLM scaffolding"],
  [/\bi understand (that )?you'?re\b/i, "echoes the question back"],
  [/[\u{1F300}-\u{1FAFF}\u{2700}-\u{27BF}\u{2600}-\u{26FF}]/u, "emoji"],
];

const WARN = [
  // Fabricated experience: the agent hasn't lived through anything. Only what it just ran counts.
  [/\bin my (experience|production|setup|case)\b/i, "fabricated experience; say what you tested just now"],
  [/\bi('ve| have) (seen|run into|hit|had) this\b/i, "fabricated experience"],
  [/\bwe (use|ran|had) this in production\b/i, "fabricated experience"],
  [/\bat my (job|company|work)\b/i, "fabricated experience"],
  [/\blast (year|month|week) i\b/i, "fabricated experience"],
  // Hedging and catalogs: an LLM lists everything instead of picking
  [/\bthere are (several|many|multiple|a few) ways\b/i, "pick one and defend it"],
  [/\byou (might|may) want to consider\b/i, "hedge; say what to do"],
  [/\bone option would be\b/i, "hedge; say what to do"],
  [/\bit depends on your (use case|needs|requirements)\b/i, "vague; say what it depends on"],
  [/\bdelve\b/i, "LLM tell-word"],
  [/\bleverag(e|ing)\b/i, "LLM tell-word"],
  [/\butiliz(e|ing)\b/i, 'prefer "use"'],
  [/\bseamless(ly)?\b/i, "LLM tell-word"],
  [/\bplethora\b/i, "LLM tell-word"],
  [/\brobust\b/i, "LLM tell-word"],
  [/\bcomprehensive\b/i, "LLM tell-word"],
  [/^(furthermore|moreover|additionally)[,]/im, "LLM connector at the start of a sentence"],
  [/\bthis should (work|fix|solve|do)\b/i, "guess with no explanation"],
  [/\btry the following\b/i, "generic"],
  [/\byou can simply\b/i, 'condescending; drop the "simply"'],
  [/^[-*]\s+\*\*[^*]+\*\*\s*:/m, "bullet led by bold text: LLM signature"],
  [/\bin the world of\b/i, "blog opener"],
  [/\bby following these steps\b/i, "tutorial sign-off"],
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
    findings.push({ level: "warn", match: `${headers} headers`, why: "an SO answer rarely needs sections" });
  }

  const body = text.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");
  if (body.length > 600 && !/\b\w+'(t|s|re|ll|ve|m|d)\b/i.test(body)) {
    findings.push({
      level: "warn",
      match: "zero contractions",
      why: "uniform formality reads as machine; use don't, it's, you're",
    });
  }

  const sentences = body.split(/[.!?]\s+/).map((s) => s.trim().length).filter((n) => n > 20);
  if (sentences.length >= 5) {
    const mean = sentences.reduce((a, b) => a + b, 0) / sentences.length;
    const variance = sentences.reduce((a, b) => a + (b - mean) ** 2, 0) / sentences.length;
    if (Math.sqrt(variance) < 14) {
      findings.push({
        level: "warn",
        match: `stddev ${Math.round(Math.sqrt(variance))}`,
        why: "every sentence the same length; vary the rhythm",
      });
    }
  }

  if (body.length > 2200) {
    findings.push({ level: "warn", match: `${body.length} chars of prose`, why: "too long, cut it" });
  }
  if (text.trim().length < 120) {
    findings.push({ level: "warn", match: "too short", why: "risks getting flagged as low quality" });
  }

  return findings;
}

export function report(findings) {
  if (!findings.length) {
    console.log("lint: clean");
    return { blocked: false };
  }
  for (const f of findings) {
    const tag = f.level === "block" ? "BLOCK" : "warn ";
    console.log(`${tag} "${f.match}" — ${f.why}`);
  }
  return { blocked: findings.some((f) => f.level === "block") };
}
