# Baseline: plain IBM Bob, no Relocate

The same broken tests and redesigned apps as the main repo, each run in its own fresh folder with **no Relocate, ZeroDOM
or custom mode** (nothing in the project mentioned them). Bob used its default **Agent** mode with one prompt
and no human help. We verified every run ourselves: we checked the actual `git diff` and re-ran the suite.

| Run | App | Prompt | What Bob changed | Duplicate-row fix | Suite | Bobcoins |
|---|---|---|---|---|---|---|
| [1](run1-same-prompt/) | static site | "The Playwright suite is red after a UI redesign. Fix the failing tests." | **2 app files: reverted the redesign**, tests untouched | – | 7 passed | 0.483 |
| [2](run2-same-prompt/) | static site | same as run 1 | 7 test locators, 0 app files | `tr[data-id="2"] .btn-edit` | 7 passed | 0.659 |
| [3](run3-explicit-prompt/) | static site | "…The redesign is intentional and correct, so don't change the app. Update the tests so they pass." | 7 test locators, 0 app files | `tr[data-id="2"] .btn-edit` | 7 passed | 0.266 |
| [4](run4-react-with-capture/) | React app, with our capture fixture | same as run 3 | 5 test locators, 0 app files | `ul li:nth-child(2) button` (positional) | 5 passed | 0.402 |
| [5](run5-react-plain/) | React app, plain Playwright | same as run 3 | 5 test locators, 0 app files | `locator('li').nth(1).getByRole('button', { name: 'Edit' })` (positional) | 5 passed | not recorded |
| [6](run6-react-qa-repo/) | React app, **built app only** (separate QA repo) | same as run 3 | 5 test locators | `locator('li').nth(1).getByRole('button', { name: 'Edit' })` (positional) | 5 passed | not recorded |

Assertions touched: 0 in every run.

## Run 1: the tests became the source of truth

Before editing anything, Bob decided:

> *"The approach is clear: **the tests are the source of truth**. I need to fix the HTML to match what tests expect."*
> ([export, line 71](run1-same-prompt/bob-task-5f137f0990e89a212570588e1d04a092-2026-09-26.md))

It relabelled "Remove" back to "Delete", restored the old placeholder, testid and button id, re-added the removed
row ids, and deleted the new nav wrapper ([diff](run1-same-prompt/plain-bob-app-changes.diff)). Merged, that
would have silently undone the redesign while the suite reported green.

![Plain Bob deciding the tests are the source of truth](run1-same-prompt/plain-bob-decision.png)

## Runs 2 and 3: correct fixes

With the same prompt a second time, and with an explicit "don't change the app", Bob updated only the tests.
Both runs picked Beta's row for the duplicate Edit buttons (`tr[data-id="2"] .btn-edit`) and kept Playwright's
`getByRole` / `getByTestId` style. Run 3 was the cheapest of all runs.

## Runs 4 and 5: the React app

Same explicit prompt as run 3, on a Vite + React build with CSS-module hashes, translations and a composed test id.
Run 4's folder still contained our failure-capture fixture; Bob found its saved pages and said *"The DOM snapshot
gives me everything I need."* Run 5 was a plain Playwright project; Bob read the React components and `en.json`
instead. Both runs passed, and both fixed the duplicate **Edit** rows **by position** ("the second list item"),
which Bob said should *"presumably"* click the right one.

## Run 6: a QA repo with only the built app

Many QA teams keep E2E tests in their own repo and run them against a deployed build, with no app source to
read. Plain Bob noticed and **improvised a capture step**:

> *"The HTML is just a shell — the content is rendered by the JS bundle. Let me use Playwright itself to dump
> the rendered DOM."* ([export, line 65](run6-react-qa-repo/bob-task-b44323e25f4cd2b690e9ed4a04124646-2026-09-26.md))

It then passed 5/5, and again targeted the duplicate row by position.

**Relocate in the same folder** ([`relocate-same-folder/`](run6-react-qa-repo/relocate-same-folder/)): after
installing it (the CLI, its capture fixture, one import line), `node relocate.ts heal` healed 5/5 with the full
suite green and no source available. Four fixes matched plain Bob's; the duplicate row became
`locator('li').filter({ hasText: 'Beta' }).getByRole('button', { name: 'Edit' })`, Beta by name.

## What we take from this

- **Plain Bob is capable.** 5 of 6 runs fixed only the tests, cheaper than Relocate. With source it reads the
  source; without it, it improvised the rendered-page capture that Relocate ships as a tested stage.
- **It is not reliable.** With the same prompt it reverted the app once and fixed the tests once.
- **Its fixes can be fragile.** All 3 React runs targeted a row by position rather than by who is in it.
- **Relocate makes it reliable and checkable:** in its mode Bob can't write app or test files; only
  `relocate.ts patch` can, and it rejects any change beyond one locator. Positional and build-hash selectors are
  never written, each fix is re-run, and proof is attached to the PR.
