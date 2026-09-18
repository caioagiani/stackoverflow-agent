import { createInterface } from "node:readline/promises";
import { spawn } from "node:child_process";
import { config, readToken, writeToken } from "./config.js";
import { apiGet } from "./client.js";

const REDIRECT = config.redirectUri;
const SCOPE = "write_access,no_expiry";

async function status() {
  const token = readToken();
  if (!token) return console.error("Sem token. Rode: npm run auth");
  if (token.expired) return console.error("Token expirado. Rode: npm run auth");

  const me = await apiGet("me", { access_token: token.access_token, filter: "default" });
  const user = me.items[0];
  if (!user) return console.error("Token válido, mas sem conta no site " + config.site);
  console.log(`${user.display_name} — ${user.reputation} rep — ${user.link}`);
  console.log(`escopo: ${token.scope} · quota ${me.quota_remaining}/${me.quota_max}`);
}

async function login() {
  if (!config.clientId) {
    console.error("Falta SO_CLIENT_ID no .env");
    process.exit(1);
  }

  const url = new URL("https://stackoverflow.com/oauth/dialog");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("scope", SCOPE);
  url.searchParams.set("redirect_uri", REDIRECT);

  console.log("\n1. Abra e autorize:\n");
  console.log(url.toString());
  console.log(`\n2. Você será redirecionado para ${REDIRECT}#access_token=...`);
  console.log("   A página pode dar 404. Tudo bem: o token está na barra de endereço.");
  console.log("3. Copie a URL inteira e cole aqui.\n");

  spawn("open", [url.toString()], { stdio: "ignore", detached: true }).unref();

  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const pasted = (await rl.question("URL: ")).trim();
  rl.close();

  const params = new URLSearchParams(pasted.split("#")[1] || pasted.split("?")[1] || "");
  const accessToken = params.get("access_token") || (/^[\w()*.-]+$/.test(pasted) ? pasted : null);

  if (!accessToken) {
    console.error("\nNão achei access_token aí.");
    if (pasted.includes("/oauth/dialog")) {
      console.error("Você colou a URL do passo 1. Preciso da URL depois de autorizar.");
    }
    console.error("Se a autorização falhou com erro de redirect_uri, confira SO_REDIRECT_URI no .env:");
    console.error(`atual: ${REDIRECT}`);
    process.exit(1);
  }

  const expires = params.get("expires");
  const path = writeToken({
    access_token: accessToken,
    scope: params.get("scope") || SCOPE,
    expires_at: expires ? Date.now() + Number(expires) * 1000 : null,
    created_at: new Date().toISOString(),
  });

  console.log(`\nToken salvo em ${path}\n`);
  await status();
}

if (process.argv.includes("--status")) await status();
else await login();
