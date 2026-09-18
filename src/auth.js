import { createInterface } from "node:readline/promises";
import { spawn } from "node:child_process";
import { config, readToken, writeToken } from "./config.js";
import { apiGet } from "./client.js";

const REDIRECT = config.redirectUri;
const SCOPE = "write_access,no_expiry";

async function status() {
  const token = readToken();
  if (!token) return console.error("no token. run: npm run auth");
  if (token.expired) return console.error("token expired. run: npm run auth");

  const me = await apiGet("me", { access_token: token.access_token, filter: "default" });
  const user = me.items[0];
  if (!user) return console.error("token is valid, but there's no account on site " + config.site);
  console.log(`${user.display_name} — ${user.reputation} rep — ${user.link}`);
  console.log(`scope: ${token.scope} · quota ${me.quota_remaining}/${me.quota_max}`);
}

async function login() {
  if (!config.clientId) {
    console.error("SO_CLIENT_ID missing from .env");
    process.exit(1);
  }

  const url = new URL("https://stackoverflow.com/oauth/dialog");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("redirect_uri", REDIRECT);

  console.log("\n1. open and authorize:\n");
  console.log(url.toString());
  console.log(`\n2. you'll be redirected to ${REDIRECT}#access_token=...`);
  console.log("   the page may 404. that's fine: the token is in the address bar.");
  console.log("3. copy the whole URL and paste it here.\n");

  spawn("open", [url.toString()], { stdio: "ignore", detached: true }).unref();

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const pasted = (await rl.question("URL: ")).trim();
  rl.close();

  const params = new URLSearchParams(pasted.split("#")[1] || pasted.split("?")[1] || "");
  const accessToken = params.get("access_token") || (/^[\w()*.-]+$/.test(pasted) ? pasted : null);

  if (!accessToken) {
    console.error("\nno access_token in there.");
    if (pasted.includes("/oauth/dialog")) {
      console.error("that's the URL from step 1. I need the URL you land on after authorizing.");
    }
    console.error("if authorization failed with a redirect_uri error, check SO_REDIRECT_URI in .env:");
    console.error(`current: ${REDIRECT}`);
    process.exit(1);
  }

  const expires = params.get("expires");
  const path = writeToken({
    access_token: accessToken,
    scope: params.get("scope") || SCOPE,
    expires_at: expires ? Date.now() + Number(expires) * 1000 : null,
    created_at: new Date().toISOString(),
  });

  console.log(`\ntoken saved to ${path}\n`);
  await status();
}

if (process.argv.includes("--status")) await status();
else await login();
