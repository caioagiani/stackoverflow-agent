import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile() {
  const path = join(ROOT, ".env");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)$/);
    if (!match) continue;
    const value = match[2].trim().replace(/^["']|["']$/g, "");
    if (value && !process.env[match[1]]) process.env[match[1]] = value;
  }
}
loadEnvFile();

export const config = {
  clientId: process.env.SO_CLIENT_ID || "",
  key: process.env.SO_KEY || "",
  site: process.env.SO_SITE || "stackoverflow",
  // Must live under the app's registered domain. Stack Exchange's login_success
  // is only accepted with "Non-Web Client OAuth Redirect URI" enabled in the dashboard.
  redirectUri: process.env.SO_REDIRECT_URI || "https://stackexchange.com/oauth/login_success",
};

const TOKEN_PATH = join(ROOT, ".secrets", "token.json");

export function readToken() {
  if (!existsSync(TOKEN_PATH)) return null;
  const token = JSON.parse(readFileSync(TOKEN_PATH, "utf8"));
  if (token.expires_at && Date.now() > token.expires_at) return { ...token, expired: true };
  return token;
}

export function writeToken(token) {
  mkdirSync(dirname(TOKEN_PATH), { recursive: true });
  writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2), { mode: 0o600 });
  return TOKEN_PATH;
}

export function requireToken() {
  const token = readToken();
  if (!token) {
    console.error("no token. run: npm run auth");
    process.exit(1);
  }
  if (token.expired) {
    console.error("token expired. run: npm run auth");
    process.exit(1);
  }
  return token.access_token;
}

export function cachePath(name) {
  const dir = join(ROOT, ".cache");
  mkdirSync(dir, { recursive: true });
  return join(dir, name);
}
