# How the game works on Stack Overflow

What makes an answer get upvoted, ignored or deleted. Read before drafting.

---

## The question already has a good answer

This is the most common case and the easiest one to get wrong. One more answer saying the same thing helps nobody: it splits the votes, pushes the page down, and usually earns a downvote.

How to decide:

- **There's an accepted, correct answer** → don't answer. If it taught you something, upvote and move on.
- **There's a correct answer at +2 or more** → don't answer. Upvote.
- **The correct answer is incomplete and you have what's missing** → upvote it **and** comment the addition. Credit stays with whoever got there first, and the information ends up in the right place.
- **The accepted answer is wrong, or broke in a newer version** → now a new answer is worth it, stating clearly what changed. Don't attack the other author.
- **Only answers at 0 or negative, none of them solve it** → answer.

An addition becomes a comment, not an answer. If the addition is too big for 600 characters and genuinely changes the solution, then it was an answer — but check again that it isn't just enthusiasm.

Upvoting requires 15 reputation, commenting requires 50.

---

## When NOT to answer

Letting one go is worth more than posting garbage. Skip the question if:

- **Essential information is missing.** No real error, no code, no version. That's a comment, not an answer.
- **It's a clear duplicate.** The right move is a close vote pointing at the original. Posting again fragments the content and usually earns a downvote.
- **It's opinion-based.** "Which framework is better", "recommend a library". Closes as opinion-based.
- **It asks you to do the work.** An assignment dumped in with no attempt.
- **It's closed.** `publish.js` blocks this on its own, but check before spending time.
- **You can't validate the answer.** If you can't test it and you aren't sure, don't post. Being wrong on SO costs reputation and, worse, misleads whoever arrives from Google later.
- **There's already an accepted, correct answer.** Only worth posting if you genuinely add something different (a case the accepted one doesn't cover, an API that changed version).

## When it is worth answering

- A specific error with the message and the code present.
- A question with 0-2 answers, created in the last few hours, with views climbing.
- A subject where you can run the code and confirm.
- An old accepted answer that broke in a newer version — a new answer stating what changed is worth it.

---

## Formatting

- Fence code with the language: ` ```js `, ` ```php `, ` ```python `.
- Error messages in a code block, not in a blockquote or italics.
- File names, flags and functions in `backticks`.
- No screenshots of code, ever.
- A direct link to the official doc on the line where it matters, not a list of links at the end.
- If you copied a snippet from another source, cite and link it. SO content is CC BY-SA; copying without attribution is grounds for removal.

---

## AI-generated content policy

SO restricts AI-generated content, and enforcement is done by human moderators and by heuristics. What keeps this safe and honest:

1. **You read and validate every answer before posting.** The agent drafts; you're the one signing it.
2. **Don't post what you couldn't defend in a follow-up comment.** If someone asks "why not use X?", you need to be able to answer.
3. **Low volume.** Sparse, good answers. A burst of answers within minutes is the pattern that triggers review.
4. **Every post created through the write API carries a link to the app's Stack Apps post.** That's public and deliberate — it's the declared channel. Don't try to route around it.

If an answer only exists because the API managed to post it, it shouldn't exist.

---

## Technical limits on writing

- Minimum body accepted by the API: 30 characters.
- The API runs the same quality checks as the site. If the site would show a CAPTCHA or a "low quality" warning, the call fails.
- There's a per-user write rate limit. If you get a throttle error, **stop** — don't retry in a loop. That's the behavior Stack Overflow classifies as abuse.
- `answers/render` validates and renders without posting. Always use it first.
- Writing requires a token with `write_access` scope and an app with a registered Stack Apps post.

---

## After posting

- Come back to the comments. An unanswered follow-up question is what turns a good answer into a downvote.
- If you're wrong, edit or delete. Editing is normal and expected.
- Don't ask for upvotes, don't ask for the accept.
