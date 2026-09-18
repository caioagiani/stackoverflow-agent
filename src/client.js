import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { config, cachePath } from "./config.js";

const BASE = "https://api.stackexchange.com/2.3";

let backoffUntil = 0;

async function respectBackoff() {
  const wait = backoffUntil - Date.now();
  if (wait > 0) {
    console.error(`API backoff: waiting ${Math.ceil(wait / 1000)}s`);
    await new Promise((resolve) => setTimeout(resolve, wait));
  }
}

function unwrap(payload) {
  if (payload.backoff) backoffUntil = Date.now() + payload.backoff * 1000;
  if (payload.error_id) {
    const error = new Error(`${payload.error_name}: ${payload.error_message}`);
    error.errorId = payload.error_id;
    error.errorName = payload.error_name;
    throw error;
  }
  return payload;
}

export async function apiGet(path, params = {}) {
  await respectBackoff();
  const url = new URL(`${BASE}/${path.replace(/^\//, "")}`);
  // site: null for methods that aren't per-site, like filters/create
  const site = params.site === null ? null : params.site || config.site;
  if (site) url.searchParams.set("site", site);
  for (const [name, value] of Object.entries(params)) {
    if (value === undefined || value === null || name === "site") continue;
    url.searchParams.set(name, String(value));
  }
  if (config.key) url.searchParams.set("key", config.key);

  const response = await fetch(url, { headers: { Accept: "application/json" } });
  const payload = await response.json();
  return unwrap(payload);
}

export async function apiPost(path, fields, accessToken) {
  await respectBackoff();
  const body = new URLSearchParams();
  body.set("site", fields.site || config.site);
  for (const [name, value] of Object.entries(fields)) {
    if (value === undefined || value === null || name === "site") continue;
    body.set(name, String(value));
  }
  if (config.key) body.set("key", config.key);
  body.set("access_token", accessToken);

  const response = await fetch(`${BASE}/${path.replace(/^\//, "")}`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  const payload = await response.json();
  return unwrap(payload);
}

// The API only hands over body_markdown with a custom filter. Create it once and cache it.
async function createFilter(name, fields) {
  const path = cachePath(`filter-${name}.json`);
  const include = fields.join(";");
  if (existsSync(path)) {
    const cached = JSON.parse(readFileSync(path, "utf8"));
    if (cached.include === include) return cached.filter;
  }
  const result = await apiGet("filters/create", { include, base: "default", unsafe: false, site: null });
  const filter = result.items[0].filter;
  writeFileSync(path, JSON.stringify({ filter, include }, null, 2));
  return filter;
}

export function markdownFilter() {
  return createFilter("post", [
    "question.body_markdown",
    "question.answers",
    "answer.body_markdown",
    "question.close_vote_count",
    "question.notice",
  ]);
}

// comment.body_markdown is listed in the filter but the API never returns it, and the body
// doesn't come through on a nested comment either. Only the dedicated endpoint delivers it.
export function commentFilter() {
  return createFilter("comment", ["comment.body"]);
}

export function quotaLine(payload) {
  return `quota left: ${payload.quota_remaining}/${payload.quota_max}`;
}
