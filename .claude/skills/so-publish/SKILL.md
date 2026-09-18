---
name: so-publish
description: Perform public actions on Stack Overflow on the owner's account — post an answer, edit an existing answer, comment or upvote. Use only when they explicitly approve the action.
---

# Acting on the owner's account

Everything here is public and goes out under their name. It can be deleted, but the history stays and the reputation already happened.

## Prerequisites, all mandatory

1. The owner approved **this specific action** in this conversation. Approval of an earlier draft doesn't carry to the next one.
2. `npm run me` returns the right account.
3. For an answer: `npm run publish -- <id> --preview` ran and the lint came out with no `BLOCK`.
4. The question isn't closed (the script checks again before posting).

If any item fails, stop and say which one.

## Commands

```
npm run publish -- <id> --yes                          # new answer
npm run edit -- <answer_id> --yes --comment "summary"  # edit a published answer
npm run comment -- <post_id> --yes --body "text"       # comment (50 rep, 600 chars)
npm run vote -- <answer_id> --yes                      # upvote (15 rep)
npm run vote -- <id> --question --yes                  # upvote the question
```

When they approve in natural language — "yes", "post it", "send it", "go ahead" — **run the command yourself**. Don't hand the command back for them to copy; they already approved.

`--yes` reflects their approval, not your convenience. Without approval in the conversation, don't run it.

Never use `--force`. It exists for the owner to decide on their own, not for the agent to route around the lint.

## Picking the right action

Before posting a new answer, confirm it would be the best on the page. If the question already has a correct answer, the path is upvote, or upvote + comment when you have a real addition. See `kb/so-rules.md`.

## Afterwards

- The link goes to `drafts/<id>/posted.json` and `answers.jsonl`. Run `npm run timeline` and show the owner.
- If the API refuses on quality or rate: **don't try again**. Report and stop. Retrying in a loop is the pattern Stack Overflow treats as abuse.
- Remind the owner to follow the comments over the next few hours. Feedback from the author becomes an edit, not a new answer.

## Pace

Low volume, high quality. Several actions in quick succession invite automated review. If they ask for a burst, say so once.
