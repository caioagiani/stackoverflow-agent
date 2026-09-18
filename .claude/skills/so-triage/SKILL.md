---
name: so-triage
description: Find Stack Overflow questions worth answering, filtered by tags (node.js, php, python) and a time window. Use when the user asks to look for new questions, find something to answer, or sweep the feed.
---

# Triage

Find a few good questions, not many questions.

## Search

```
npm run feed -- --tags node.js,php,python --hours 12 --max 15
npm run feed -- --tags node.js --hours 6 --unanswered
npm run feed -- --search "free text"
```

The feed already drops closed questions, answered ones and anything with 3+ answers, and sorts by views per answer — a proxy for "lots of people have this problem and nobody solved it".

The feed tags each question:

- **OPEN** — nobody answered
- **WEAK** — only answers at 0 or negative
- **COVERED** — has an accepted answer or one at +2

## Actually filter

From the candidates, read the titles and pick at most 5, applying `kb/so-rules.md`:

- Is there a specific error and code in the body?
- Could you test the fix locally?
- Does it match a pattern already mapped in `kb/nodejs.md`, `kb/php.md`, `kb/python.md`?

Discard without mercy: opinion-based, no repro, assignment dumps, "which is better", library requests.

**COVERED is not an automatic discard, and it's not an invitation to answer either.** Open the existing answer with `npm run question -- <id>` and decide: if it solves the problem, the path is upvote; if something you have is missing, it's upvote + comment; if it's wrong, then an answer is warranted. Never propose an answer that would say the same thing as the one above it.

## Present

One line per candidate: id, short title, the suggested path (answer / add a comment / upvote / skip) and **why** in half a line. Then ask which one to work on. Don't draft several at once.
