const NAMED = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  rsquo: "’",
  lsquo: "‘",
  ldquo: "“",
  rdquo: "”",
};

// A API devolve body_markdown com entidades HTML escapadas.
export function decodeEntities(text = "") {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name) => NAMED[name.toLowerCase()] ?? match);
}

// Comentários só vêm em HTML: comment.body_markdown existe no filtro mas a API nunca o retorna.
export function htmlToText(html = "") {
  return decodeEntities(
    html
      .replace(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "$2 ($1)")
      .replace(/<code>(.*?)<\/code>/gi, "`$1`")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, ""),
  ).replace(/\s+/g, " ").trim();
}
