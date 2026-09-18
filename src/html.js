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

// The API returns body_markdown with HTML entities escaped.
export function decodeEntities(text = "") {
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&([a-z]+);/gi, (match, name) => NAMED[name.toLowerCase()] ?? match);
}

// Comments only come as HTML: comment.body_markdown exists in the filter but the API never returns it.
export function htmlToText(html = "") {
  return decodeEntities(
    html
      .replace(/<a[^>]+href="([^"]+)"[^>]*>(.*?)<\/a>/gi, "$2 ($1)")
      .replace(/<code>(.*?)<\/code>/gi, "`$1`")
      .replace(/<br\s*\/?>/gi, " ")
      .replace(/<[^>]+>/g, ""),
  ).replace(/\s+/g, " ").trim();
}
