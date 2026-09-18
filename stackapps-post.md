# Texto para publicar em stackapps.com

Publique como pergunta nova em https://stackapps.com/questions/ask, tags: `script` `api` `stackoverflow`.
Depois cole a URL do post em **Edit details → Stack Apps post** no painel do app.

---

**Título:**

Answer Drafter — a local CLI I use to draft and post my own Stack Overflow answers

---

**Corpo:**

A command line tool I run locally to help me answer questions on Stack Overflow, mostly in the `node.js`, `php` and `python` tags.

It does three things:

1. Lists recent unanswered questions in the tags I follow, using `/questions` and `/search/advanced`.
2. Pulls one question with its comments and existing answers into a local markdown file so I can work on it offline.
3. Posts my answer through `/questions/{id}/answers/add` once I've reviewed it.

**What it is not:** it does not post anything on its own. Every answer is written against a local draft, run through `/questions/{id}/answers/render` first, and posted only after I read the final text. I use an LLM to help draft, and I test the code before posting — if I can't verify an answer, I don't post it. One question at a time, no batching, no automated retries on rate limit errors.

The tool refuses to post to closed questions and stops on any write error instead of retrying.

Written in Node.js, no dependencies, runs only on my machine. Uses the implicit OAuth flow with `write_access`.

Scopes used: `write_access`, `no_expiry`.

Feedback welcome — if anything here looks like it would harm content quality, tell me and I'll change it.
