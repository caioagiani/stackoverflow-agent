---
name: so-answer
description: Draft an answer to a Stack Overflow question. Use whenever the user pastes a stackoverflow.com question link or id, or asks to answer/analyze a community question.
---

# Draft an answer

Input: a question link or id. Output: a draft in `drafts/<id>/answer.md` that the user approves before posting.

Never post from this skill. Posting is the `so-publish` skill, and only with an explicit OK from the user in the conversation.

## 1. Pull the question

```
npm run question -- <id or url>
```

Saves `drafts/<id>/question.md` with the body, comments and existing answers as markdown.

## 2. Pick the path

Read `kb/so-rules.md` and pick one of the four, explicitly:

| situation | path |
| --- | --- |
| no answers, or the existing ones are wrong | answer |
| already has a correct answer and you agree | `npm run vote -- <answer_id> --yes` and nothing else |
| correct answer but incomplete, and you have what's missing | upvote + `npm run comment` with the addition |
| no repro, opinion-based, duplicate, closed, or you can't validate it | skip |

If the path isn't "answer", **tell the user in two lines which one it is and why, then stop**. Don't draft out of obligation, and don't write an answer that would say the same thing as the one already there.

A new answer is only justified if it would be the best on the page.

## 3. Actually understand it

- Read `kb/<language>.md` (nodejs, php, python) and look for the symptom. Most questions match a pattern that's already mapped.
- Use the `so_search` MCP tool to find the canonical question on the subject. If it's a clear duplicate, go back to step 2.
- Confirm behavior in the official docs whenever the answer depends on a version. Don't trust memory for flags, API names and defaults.

## 4. Test before claiming

If it can be run, run it. Use the session scratchpad, never the project directory.

```
node /tmp/.../repro.mjs
php /tmp/.../repro.php
python3 /tmp/.../repro.py
```

Reproduce the author's error, apply the fix, confirm it passes. If you couldn't test it, the draft says explicitly what wasn't tested.

## 5. Write

Open `kb/voice.md` and follow it exactly. The operational summary:

- The first line is the cause or the fix. No preamble, no greeting, no echo of the question.
- Minimal diff, the author's variable names preserved.
- No closer, no summary, no emoji, no bullet opening with bold.
- Contractions, and sentences of different lengths.
- English on `stackoverflow.com`.

Write it to `drafts/<id>/answer.md`.

## 6. Check

```
npm run publish -- <id> --preview
```

Runs the anti-LLM lint and renders through Stack Overflow itself without posting. Any `BLOCK` means rewrite — don't use `--force`.

## 7. Hand it to the user

Show it in the terminal, in short blocks:

1. The whole draft.
2. What was verified by running code, and what wasn't.
3. Why this approach and not the obvious alternative.
4. Risks: close votes, a competing answer, an author's premise being contradicted.

Don't post here. When they approve — "yes", "post it", "send it" — run `npm run publish -- <id> --yes` yourself, without handing the command back for them to copy.
