# stackoverflow-agent

> Technical support for developers who haven't discovered AI yet.

There is a population of developers who solve problems by opening fourteen Stack Overflow tabs. They don't ask a model. They **search**. They read answers from 2014. They scroll down to the comment warning that it stopped working in version 8. They type the code with their own hands, character by character, like the ancients.

This project exists to serve that population.

## Profile of the assisted

- Has fourteen tabs open. The answer is in the eleventh.
- Copies the first code block from the accepted answer. The accepted answer is from 2013.
- Reads the "deprecated since 5.4" comment after deploying.
- Calls it research when he reads six wrong answers before the right one.
- His autocomplete is Ctrl+C.

None of this is his fault. Nobody told him. And honestly, someone has to keep feeding the corpus.

## The circle closes itself

An AI spins up a container, tests the hypothesis, measures the result and writes the answer. A human reads it, checks it and signs it. Three days later the developer from the previous decade finds it all ready on Google and fixes his problem in forty seconds.

He'll never know. It's better this way.

## How the service works

Every question falls into one of four paths, and the path comes before the text:

| situation | path |
| --- | --- |
| no answers, or the existing ones are wrong | answer |
| already has a correct answer and we agree with it | upvote, nothing more |
| correct answer but incomplete | upvote + comment with what's missing |
| no repro, opinion-based, duplicate, or impossible to validate | skip |

A new answer is only justified when it would be the best on the page. Tying with what's already there clutters the question and earns a downvote — which would be, let's admit, ironic.

```
npm run feed -- --tags node.js,php,python --hours 96
npm run question -- <id>
   ↓ pick the path
   ↓ actually test the code
   ↓ drafts/<id>/answer.md
npm run publish -- <id> --preview      # anti-LLM lint + render by SO itself
   ↓ explicit human approval
npm run publish -- <id> --yes
```

## The work nobody asked for

Two real examples, because the joke only lands if the work underneath it is serious.

**Why a `CAST()` made a MariaDB query 100x faster.** The accepted answer said it was the server character set. The question author tested it and it wasn't. So: we spun up MariaDB 11.8 in a container, recreated the 100k-row table, ran `EXPLAIN` with and without `CAST`, and found the culprit wasn't the `CAST` — it was the `?`. A single prepared-statement placeholder is enough to stop the optimizer from pushing the condition into the materialized view. Confirmed by turning `condition_pushdown_for_derived` off and watching both versions get equally slow.

**Whether `atexit` can close a database connection in WSGI.** It can't. We sent `SIGTERM` to a real Python process to find out. `atexit` runs on Ctrl+C and does not run on `SIGTERM` — which is exactly the signal Apache uses to stop a worker.

In both cases the investigation took longer than the author spent writing the question. Someone will copy the code block without reading the paragraph that explains why. That's fine.

## What it does not do

This part is not satire.

- **It does not post on its own.** Every draft needs explicit approval, and the approval covers that text only. Text changed, ask again.
- **It does not work around the lint.** `src/lint.js` catches LLM smell — preamble, uniform sentence rhythm, hedging, bullets that open with bold. A block means rewrite, not force.
- **It does not retry** after a rate limit or a quality rejection from the API. It stops and reports.
- **It does not post what wasn't tested.** If it could have been run and wasn't, that gets said out loud.
- **It does not invent experience.** No "I ran into this in production". What makes writing sound human is saying what you just tested, and having an opinion.

> If an answer only exists because the API managed to post it, it shouldn't exist.
> — `kb/so-rules.md`

## Install

```bash
npm install
cp .env.example .env     # SO_CLIENT_ID, SO_KEY, SO_SITE, SO_REDIRECT_URI
npm run auth             # OAuth implicit flow, scope write_access,no_expiry
npm run me               # check token and reputation
```

Writing through the API requires a registered app with a published Stack Apps post. Every post created through it carries a link back to that registration — public and deliberate.

## Commands

```bash
npm run feed -- --tags node.js,php,python --hours 96   # triage with coverage classification
npm run question -- <id>                               # question, comments and existing answers
npm run publish -- <id> --preview                      # lint + render, posts nothing
npm run publish -- <id> --yes                          # post (after approval)
npm run edit -- <answer_id> --yes --comment "summary"  # edit a published answer
npm run comment -- <post_id> --yes --body "text"       # comment (50 rep)
npm run vote -- <answer_id> --yes                      # upvote (15 rep)
npm run timeline                                       # history with current scores
```

## Layout

```
src/auth.js       OAuth implicit flow, stores the token
src/client.js     REST 2.3 client, backoff, filters
src/feed.js       triage, tags each question OPEN / WEAK / COVERED
src/question.js   question + answers + comments as markdown
src/lint.js       LLM smell detector
src/publish.js    render, checks and POST answers/add
src/edit.js       edits a published answer
src/comment.js    comments on a question or an answer
src/vote.js       upvote and undo
src/timeline.js   history with current scores, writes TIMELINE.md
kb/               voice, SO rules, per-language patterns
drafts/<id>/      question.md, answer.md, posted.json
answers.jsonl     append-only log of what was posted
```

Node 20+, no runtime dependencies. Runs locally.

## License

Public domain — [Unlicense](https://unlicense.org).

---

No developer from the previous decade was consulted in the making of this README.
