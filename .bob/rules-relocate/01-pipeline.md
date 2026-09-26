# Relocate pipeline

Work from the repo root. All state lives in `.relocate/`.

1. **Capture (you, the orchestrator).** Run `node relocate.ts capture`.
   Read `.relocate/failures.json`. Each entry `n` is one stale locator. If `failures` is
   empty, stop and say the suite is green.

2. **Fan out: spawn one subagent per failure, all at once, in parallel.** Do not run them
   one after another. Give each subagent exactly this task, with its own `n`:

   > You are Relocate task T<n>. Run the three stages below in order and report the result.
   > - **Visual DOM Auditor:** run `node relocate.ts audit <n>`. Read
   >   `.relocate/tasks/<n>/audit.json`, `.relocate/tasks/<n>/graph.txt` and look at
   >   `.relocate/tasks/<n>/failure_proof.png` (cyan `[N]` badges = ZeroDOM handles). Compare
   >   the failing line's intent (role, accessible name, the assertion right after it) with
   >   the ranked `candidates`. Every candidate already has `count() == 1`. Pick index `k`:
   >   keep 0 unless another candidate clearly matches the test's intent better; say why.
   > - **Code Healer:** run `node relocate.ts patch <n> <k>`. Never edit the spec yourself.
   > - **Proof Verifier:** run `node relocate.ts verify <n>`. Exit 0 = certified. It retries
   >   the next candidate once on failure and restores the original spec if nothing passes.
   > Report: old selector, handle, new selector, similarity, PASS/FAIL.

3. **Report (you).** When every subagent has finished, run `node relocate.ts report`
   (add `--pr` only if the user asked for a pull request). Summarise the table it prints and
   point to `relocate-proof/` (failure vs healed PNGs, `receipt.json`, `PR.md`).

## Hard rules
- Never modify assertions, `expect(...)` calls, or add `test.skip` / `test.only`.
- Never hand-edit files under `tests/`; only `relocate.ts patch` writes there.
- If a task ends FAIL, report it honestly; do not "fix" it another way.
