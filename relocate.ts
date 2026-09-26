// Relocate: red test -> ZeroDOM graph -> ranked handle -> minimal patch -> green test -> receipt/PR.
// Every stage is a subcommand so IBM Bob subagents can drive it; `heal` runs the whole loop itself.
//
//   node relocate.ts capture            red run, write .relocate/failures.json
//   node relocate.ts audit  <n>         ZeroDOM graph + ranked candidates + failure_proof.png
//   node relocate.ts patch  <n> [k]     swap the stale locator for candidate k (default 0)
//   node relocate.ts verify <n>         re-run the spec; one fallback retry with the next candidate
//   node relocate.ts report [--pr [--base <branch>]]  terminal report, receipt.json, PR.md (and open the PR)
//   node relocate.ts heal   [--pr [--base <branch>]]  all of the above, one concurrent task per failure
import { chromium, type Page } from '@playwright/test';
import { parseHtml, type GraphNode } from '@vexralabs/zerodom';
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, copyFileSync, rmSync } from 'node:fs';
import { relative } from 'node:path';

const OUT = '.relocate';
const PROOF = 'relocate-proof'; // committed with the PR so the body can link the images
const PORT = 4173;
const T0 = Date.now();

// Agents (Bob) capture output through a pipe: strip ANSI colours there so logs and exports stay readable.
if (!process.stdout.isTTY || process.env.NO_COLOR) {
  const plain = console.log;
  console.log = (...a: unknown[]) => plain(...a.map(x => (typeof x === 'string' ? x.replace(/\x1b\[[0-9;]*m/g, '') : x)));
}

type Failure = {
  n: number; file: string; line: number; specLine: number; title: string; testId: string; expr: string;
  selector: string; action: 'click' | 'fill' | null; error: string; at: string;
};
type Candidate = { handle: string; selector: string; zerodom?: string; label: string; type: string; score: number; similarity: number; count?: number };

const read = <T>(p: string): T => JSON.parse(readFileSync(p, 'utf8'));
const write = (p: string, v: unknown) => writeFileSync(p, typeof v === 'string' ? v : JSON.stringify(v, null, 2));
const taskDir = (n: number) => { const d = `${OUT}/tasks/${n}`; mkdirSync(d, { recursive: true }); return d; };
const log = (tag: string, msg: string) =>
  console.log(`\x1b[2m+${String(Date.now() - T0).padStart(5)}ms\x1b[0m \x1b[36m[${tag}]\x1b[0m ${msg}`);

// ---------- server ----------
async function up() { try { return (await fetch(`http://127.0.0.1:${PORT}`)).ok; } catch { return false; } }
async function ensureServer() {
  if (await up()) return;
  // ponytail: detached so concurrent verify runs share one server; `report` stops it
  const p = spawn('python3', ['-m', 'http.server', String(PORT), '-d', 'demo-app'], { detached: true, stdio: 'ignore' });
  p.unref();
  mkdirSync(OUT, { recursive: true });
  write(`${OUT}/server.pid`, String(p.pid));
  for (let i = 0; i < 50 && !(await up()); i++) await new Promise(r => setTimeout(r, 100));
}
function stopServer() {
  if (!existsSync(`${OUT}/server.pid`)) return;
  try { process.kill(Number(readFileSync(`${OUT}/server.pid`, 'utf8'))); } catch {}
}

// ---------- test runner ----------
function runPlaywright(args: string[]): Promise<{ code: number; ms: number; report: any }> {
  const start = Date.now();
  return new Promise(res => {
    const p = spawn('npx', ['playwright', 'test', ...args, '--reporter=json'], { stdio: ['ignore', 'pipe', 'ignore'] });
    let out = '';
    p.stdout.on('data', d => (out += d));
    p.on('close', code => {
      let report = null;
      try { report = JSON.parse(out); } catch {}
      res({ code: code ?? 1, ms: Date.now() - start, report });
    });
  });
}

function* specs(suite: any): Generator<any> {
  for (const s of suite.specs ?? []) yield s;
  for (const c of suite.suites ?? []) yield* specs(c);
}

// ---------- FR-1: capture ----------
async function capture(): Promise<Failure[]> {
  await ensureServer();
  // Stale tasks/snapshots from a previous run would be mistaken for this run's backups.
  rmSync(`${OUT}/tasks`, { recursive: true, force: true });
  rmSync(`${OUT}/snapshots`, { recursive: true, force: true });
  log('capture', 'running playwright test (expecting RED)');
  const { code, report } = await runPlaywright([]);
  const failures: Failure[] = [];
  for (const s of (report?.suites ?? []).flatMap((x: any) => [...specs(x)])) {
    const r = s.tests[0].results.at(-1);
    if (r.status === 'passed') continue;
    const err = r.errors?.[0] ?? r.error;
    const msg: string = (err?.message ?? '').replace(/\x1b\[\d+m/g, '');
    // locator('...'), getByRole(...), getByTestId(...), chains: whatever Playwright was waiting for.
    const expr = msg.match(/waiting for ((?:locator|getBy\w+)\(.*)$/m)?.[1].trim();
    const sel = expr?.match(/^locator\((['"`])(.*)\1\)$/)?.[2] ?? expr;
    if (!expr || !sel || !err.location) {
      log('capture', `\x1b[31mskip\x1b[0m ${s.title}: not a stale-locator failure (GATE-01)`);
      continue;
    }
    const src = readFileSync(err.location.file, 'utf8').split('\n')[err.location.line - 1];
    failures.push({
      n: failures.length + 1, file: relative('.', err.location.file), line: err.location.line, specLine: s.line,
      title: s.title, testId: s.id, expr, selector: sel, action: /\.fill\(/.test(src) ? 'fill' : /\.click\(/.test(src) ? 'click' : null,
      error: msg.split('\n')[0], at: new Date().toISOString(),
    });
  }
  write(`${OUT}/failures.json`, { exitCode: code, failures });
  log('capture', `exit code ${code}, ${failures.length} stale locator(s)`);
  for (const f of failures) log('capture', `  #${f.n} ${f.file}:${f.line}  \x1b[31m${f.selector}\x1b[0m`);
  return failures;
}

// ---------- FR-3.1: auditor scoring ----------
const STOP = new Set(('the an and is are of to on in it its await page locator click fill expect tohavetext tohavevalue test async const let '
  + 'get by role id name exact placeholder label text').split(' '));
export const words = (s: string) =>
  new Set((s.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase().match(/[a-z]{2,}/g) ?? []).filter(w => !STOP.has(w)));
const lastTag = (sel: string) =>
  sel.match(/getByRole\((['"])(\w+)\1/)?.[2] ?? sel.match(/(?:^|[\s>+~])([a-z][a-z0-9]*)(?=[.#[:]|$)[^\s>+~]*$/)?.[1];
// "removed" ~ "remove", "places" ~ "place": prefix match on words of 4+ letters, no stemmer.
const has = (text: Set<string>, w: string) =>
  text.has(w) || [...text].some(t => Math.min(t.length, w.length) >= 4 && (t.startsWith(w) || w.startsWith(t)));

// ponytail: bag-of-words overlap, not embeddings. Deterministic and explainable in the receipt;
// swap in an LLM/embedding ranker if real suites show ties the verifier fallback can't absorb.
// `near` = text of each node's row/list item/form (FR-3.1 neighbouring context); breaks ties between identical "Edit" buttons.
export function rank(nodes: GraphNode[], oldSelector: string, context: string, action: Failure['action'], near: Record<string, string> = {}): Candidate[] {
  const sel = words(oldSelector), ctx = words(context), tag = lastTag(oldSelector);
  for (const w of sel) ctx.delete(w);
  const max = 2 * sel.size + ctx.size + 2 || 1;
  return nodes
    .filter(n => !action || n.action === action)
    .map(n => {
      const text = words([n.type, n.role, n.label, n.selector, n.placeholder, n.input_type, n.href].filter(Boolean).join(' '));
      let score = 0;
      const around = words(near[n.id] ?? '');
      for (const w of sel) if (has(text, w)) score += 2;
      for (const w of ctx) if (has(text, w)) score += 1;
      for (const w of ctx) if (!has(text, w) && has(around, w)) score += 1;
      if (tag && (n.type === tag || n.role === tag)) score += 2;
      return { handle: n.id, selector: n.selector, label: n.label, type: n.type, score, similarity: +(score / max).toFixed(2) };
    })
    .filter(c => c.score > 0)
    .sort((a, b) => b.score - a.score);
}

async function snapshotPage(f: Failure): Promise<{ page: Page; close: () => Promise<void>; html: string; url: string }> {
  const dir = `${OUT}/snapshots/${f.testId}`;
  const html = readFileSync(`${dir}/dom.html`, 'utf8'), url = readFileSync(`${dir}/url.txt`, 'utf8');
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(url); // keep the origin, then restore the exact failure-time DOM
  await page.setContent(html);
  return { page, html, url, close: () => browser.close() };
}

// FR-2.3: numbered cyan badges over every interactive node; the chosen one gets an outline.
async function badges(page: Page, nodes: { id: string; selector: string }[], target?: string, color = '#22e0d8') {
  await page.evaluate(({ nodes, target, color }) => {
    for (const n of nodes) {
      const el = document.querySelector(n.selector) as HTMLElement | null;
      if (!el) continue;
      const r = el.getBoundingClientRect();
      const b = document.createElement('div');
      b.id = `zerodom-badge-${n.id}`;
      b.textContent = `[${n.id.replace(/^node_/, "")}]`;
      Object.assign(b.style, {
        position: 'absolute', left: `${r.left + scrollX - 4}px`, top: `${r.top + scrollY - 14}px`, zIndex: '99999',
        background: color, color: '#000', font: 'bold 11px monospace', padding: '1px 4px', borderRadius: '3px',
      });
      document.body.appendChild(b);
      if (n.id === target) el.style.outline = `3px solid ${color}`;
    }
  }, { nodes, target, color });
}

// ZeroDOM's selector is exact but can be positional (`body > button:nth-of-type(2)`) or carry a CSS-module
// build hash (`._solid_h-dyu`); writing either into a test makes it *more* brittle. So once ZeroDOM has found
// the element, write what a human would: in the test's own style (getBy* stays getBy*, CSS stays CSS),
// and only if it still resolves to exactly that same element.
const HASHED = /\._[A-Za-z][\w-]*_[A-Za-z0-9_-]{5}(?![\w-])/;
export const brittle = (sel: string) => /nth-of-type|^body >/.test(sel) || HASHED.test(sel);
const lit = (v: string) => (v.includes("'") ? JSON.stringify(v) : `'${v}'`);
type Option = { kind: string; expr: string; make: (p: Page) => ReturnType<Page['locator']> };

async function stabilize(page: Page, zerodomSel: string, oldExpr: string): Promise<string> {
  const el = await page.locator(zerodomSel).evaluate(el => {
    const text = (el as HTMLElement).innerText?.trim().replace(/\s+/g, ' ') ?? '';
    const tag = el.tagName.toLowerCase(), type = el.getAttribute('type') ?? '';
    const role = el.getAttribute('role') ?? ({ button: 'button', a: el.hasAttribute('href') ? 'link' : '', select: 'combobox', textarea: 'textbox' } as Record<string, string>)[tag]
      ?? (tag === 'input' ? ({ search: 'searchbox', checkbox: 'checkbox', radio: 'radio', submit: 'button', button: 'button' } as Record<string, string>)[type] ?? 'textbox' : '');
    const row = el.closest('tr, li, [role=row], [role=listitem]');
    const attr = (a: string) => el.getAttribute(a) ?? '';
    return { tag, role, text, id: el.id, testid: attr('data-testid'), name: attr('name'), aria: attr('aria-label'), placeholder: attr('placeholder'),
             rowTag: row?.tagName.toLowerCase() ?? '', rowKey: (row?.firstElementChild as HTMLElement | null)?.innerText?.trim() ?? '' };
  });
  const name = el.aria || (el.text.length <= 40 && !/\d/.test(el.text) ? el.text : ''); // digits: live counters, "Cart (3)"
  const opts: Option[] = [];
  if (el.testid) opts.push({ kind: 'testid', expr: `getByTestId(${lit(el.testid)})`, make: p => p.getByTestId(el.testid) });
  if (el.role && name) {
    opts.push({ kind: 'role', expr: `getByRole(${lit(el.role)}, { name: ${lit(name)} })`, make: p => p.getByRole(el.role as any, { name }) });
    opts.push({ kind: 'role', expr: `getByRole(${lit(el.role)}, { name: ${lit(name)}, exact: true })`, make: p => p.getByRole(el.role as any, { name, exact: true }) });
  }
  if (el.placeholder) opts.push({ kind: 'placeholder', expr: `getByPlaceholder(${lit(el.placeholder)})`, make: p => p.getByPlaceholder(el.placeholder) });
  if (el.rowTag && el.rowKey && el.role && name && el.rowKey !== name)
    opts.push({ kind: 'row', expr: `locator(${lit(el.rowTag)}).filter({ hasText: ${lit(el.rowKey)} }).getByRole(${lit(el.role)}, { name: ${lit(name)} })`,
                make: p => p.locator(el.rowTag).filter({ hasText: el.rowKey }).getByRole(el.role as any, { name }) });
  const css = (sel: string, kind = 'css') => opts.push({ kind, expr: `locator(${lit(sel)})`, make: p => p.locator(sel) });
  if (el.id) css(`#${el.id.replace(/([^\w-])/g, '\\$1')}`);
  for (const [a, v] of [['data-testid', el.testid], ['name', el.name], ['aria-label', el.aria], ['placeholder', el.placeholder]])
    if (v) css(`${el.tag}[${a}="${v.replace(/"/g, '\\"')}"]`);
  if (!brittle(zerodomSel)) css(zerodomSel, 'zerodom');

  // Same method the test already used first, then the rest of its family, then the other family.
  const same = oldExpr.match(/^getBy(\w+)/)?.[1].toLowerCase(), getBy = ['testid', 'role', 'placeholder', 'row'];
  const rankOf = (o: Option) => same
    ? (o.kind === same ? 0 : getBy.includes(o.kind) ? 1 : 2)
    : (getBy.includes(o.kind) ? (o.kind === 'row' ? 2 : 1) : 0);
  for (const o of opts.sort((x, y) => rankOf(x) - rankOf(y))) {
    try {
      const l = o.make(page);
      if ((await l.count()) === 1 && (await l.evaluate((e, z) => e === document.querySelector(z), zerodomSel))) return o.expr;
    } catch {} // an option the engine rejects: skip it
  }
  return `locator(${lit(zerodomSel)})`;
}

async function audit(n: number) {
  const f = read<{ failures: Failure[] }>(`${OUT}/failures.json`).failures[n - 1];
  const tag = `T${n}:auditor`;
  const snap = await snapshotPage(f);
  try {
    const t = performance.now();
    const graph = parseHtml(snap.html, snap.url);
    const parseMs = +(performance.now() - t).toFixed(2);
    log(tag, `ZeroDOM graph: ${graph.nodes.length} nodes in ${parseMs}ms`);

    const src = readFileSync(f.file, 'utf8').split('\n');
    const context = [f.title, ...src.slice(f.line - 1, f.line + 2)].join(' ');
    const near: Record<string, string> = await snap.page.evaluate(nodes => Object.fromEntries(nodes.map(n => {
      const box = document.querySelector(n.selector)?.closest('tr, li, [role=row], [role=listitem], article, fieldset');
      return [n.id, (box as HTMLElement | null)?.innerText.slice(0, 200) ?? ''];
    })), graph.nodes.map(n => ({ id: n.id, selector: n.selector })));
    const candidates = rank(graph.nodes, f.expr, context, f.action, near);
    for (const c of candidates) c.count = await snap.page.locator(c.selector).count(); // GATE-02
    const unique = candidates.filter(c => c.count === 1);
    for (const c of unique) { c.zerodom = c.selector; c.selector = await stabilize(snap.page, c.selector, f.expr); } // selector now = full locator expression
    const best = unique[0];

    await badges(snap.page, graph.nodes, best?.handle);
    const dir = taskDir(n);
    await snap.page.screenshot({ path: `${dir}/failure_proof.png`, fullPage: true });
    write(`${dir}/graph.txt`, graph.toCompactText({ selectors: true }));
    write(`${dir}/audit.json`, { failure: f, parseMs, nodes: graph.nodes.length, candidates: unique, rejectedAmbiguous: candidates.filter(c => c.count !== 1) });

    if (!best) log(tag, `\x1b[31mno unique candidate for ${f.selector}\x1b[0m`);
    else log(tag, `${f.selector} -> [${best.handle}] ${best.type} '${best.label}'  sim=${best.similarity}  count()=1`);
    return best;
  } finally { await snap.close(); }
}

// ---------- FR-3.2: healer ----------
export function swapLocator(source: string, line: number, expr: string, oldSel: string, newExpr: string): string {
  const lines = source.split('\n');
  const orig = lines[line - 1];
  if (orig === undefined) throw new Error(`line ${line} missing`);
  if (orig.includes(expr)) lines[line - 1] = orig.replace(expr, newExpr);
  else { // same locator, written with other quotes than Playwright's error message uses
    const m = orig.match(new RegExp(`locator\\((['"\`])${oldSel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\1\\)`));
    if (!m) throw new Error(`locator ${expr} not found on line ${line}`);
    lines[line - 1] = orig.replace(m[0], newExpr);
  }
  // GATE-04: only the locator literal on that one line may differ.
  const out = lines.join('\n'), before = source.split('\n');
  const changed = lines.filter((l, i) => l !== before[i]);
  if (changed.length !== 1 || lines.length !== before.length) throw new Error('GATE-04: patch touched more than the locator line');
  return out;
}

// Bob subagents are separate processes that may patch sibling lines of one spec at the same moment.
// mkdir is atomic, so it doubles as a cross-process lock around each read-modify-write.
function withLock<T>(file: string, fn: () => T): T {
  const lock = `${file}.relocate-lock`;
  for (let i = 0; ; i++) {
    try { mkdirSync(lock); break; } catch {
      if (i > 250) rmSync(lock, { recursive: true, force: true }); // ~5s: holder died, break the lock
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 20);
    }
  }
  try { return fn(); } finally { rmSync(lock, { recursive: true, force: true }); }
}

function patch(n: number, k = 0) {
  const a = read<{ failure: Failure; candidates: Candidate[] }>(`${OUT}/tasks/${n}/audit.json`);
  const c = a.candidates[k];
  if (!c) throw new Error(`no candidate #${k} for task ${n}`);
  const dir = taskDir(n);
  withLock(a.failure.file, () => {
    const current = readFileSync(a.failure.file, 'utf8').split('\n');
    if (!existsSync(`${dir}/original.line`)) write(`${dir}/original.line`, current[a.failure.line - 1]);
    current[a.failure.line - 1] = readFileSync(`${dir}/original.line`, 'utf8');
    writeFileSync(a.failure.file, swapLocator(current.join('\n'), a.failure.line, a.failure.expr, a.failure.selector, c.selector));
  });
  write(`${dir}/patch.json`, { candidate: k, from: a.failure.selector, to: c.selector, zerodom: c.zerodom, handle: c.handle });
  log(`T${n}:healer`, `${a.failure.file}:${a.failure.line}  '${a.failure.selector}' -> '${c.selector}'`);
}

// ---------- FR-3.3: verifier ----------
async function verify(n: number, retry = true): Promise<boolean> {
  await ensureServer();
  const tag = `T${n}:verifier`;
  const a = read<{ failure: Failure; candidates: Candidate[] }>(`${OUT}/tasks/${n}/audit.json`);
  const dir = taskDir(n);
  const run = await runPlaywright([`${a.failure.file}:${a.failure.specLine}`]); // this test only; siblings may still be red
  const pass = run.code === 0 && run.ms <= 30_000; // GATE-05
  const p = read<{ candidate: number; to: string; zerodom?: string; handle: string }>(`${dir}/patch.json`);
  log(tag, `exit ${run.code} in ${run.ms}ms -> ${pass ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'}`);

  if (pass) {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    await page.goto(readFileSync(`${OUT}/snapshots/${a.failure.testId}/url.txt`, 'utf8'));
    await badges(page, [{ id: p.handle, selector: p.zerodom ?? p.to }], p.handle, '#24a148');
    await page.screenshot({ path: `${dir}/healed_proof.png`, fullPage: true });
    await browser.close();
  } else if (retry && a.candidates[p.candidate + 1]) {
    log(tag, 'fallback: retrying with next candidate');
    patch(n, p.candidate + 1);
    return verify(n, false);
  } else {
    restore(n); // never leave a broken patch behind
    log(tag, 'no candidate passed, original line restored');
  }
  write(`${dir}/verify.json`, { exitCode: run.code, ms: run.ms, pass });
  return pass;
}

// ---------- FR-4: report / receipt / PR ----------
async function report(pr: boolean) {
  const { failures } = read<{ failures: Failure[] }>(`${OUT}/failures.json`);
  rmSync(PROOF, { recursive: true, force: true }); // proof must describe this run only
  mkdirSync(PROOF, { recursive: true });
  const rows = failures.map(f => {
    const d = `${OUT}/tasks/${f.n}`;
    const a = existsSync(`${d}/audit.json`) ? read<any>(`${d}/audit.json`) : null;
    const p = existsSync(`${d}/patch.json`) ? read<any>(`${d}/patch.json`) : null;
    const v = existsSync(`${d}/verify.json`) ? read<any>(`${d}/verify.json`) : null;
    const c = p && a?.candidates[p.candidate];
    for (const img of ['failure_proof', 'healed_proof'])
      if (existsSync(`${d}/${img}.png`)) copyFileSync(`${d}/${img}.png`, `${PROOF}/${f.n}-${img}.png`);
    return { ...f, parseMs: a?.parseMs, handle: c?.handle, newSelector: c?.selector, similarity: c?.similarity, pre: 'FAIL', post: v?.pass ? 'PASS' : 'FAIL', verifyMs: v?.ms };
  });
  const healed = rows.filter(r => r.post === 'PASS').length;
  const receipt = { generatedAt: new Date().toISOString(), healed, total: rows.length, results: rows } as any;

  console.log('\n\x1b[1mRelocate report\x1b[0m');
  for (const r of rows) {
    console.log(`\n #${r.n} ${r.file}:${r.line}  "${r.title}"`);
    console.log(`   initial failure  ${r.error}  (${r.at})`);
    console.log(`   identified       \x1b[31m${r.selector}\x1b[0m -> \x1b[32m${r.newSelector ?? '-'}\x1b[0m  handle [${r.handle ?? '-'}]  sim ${r.similarity ?? '-'}  parse ${r.parseMs}ms`);
    console.log(`   proof gate       pre \x1b[31mFAIL\x1b[0m  ->  post ${r.post === 'PASS' ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m'} (${r.verifyMs}ms)`);
  }
  await ensureServer();
  const suite = await runPlaywright([]); // GATE-05 for the whole suite, not just each healed test
  const st = suite.report?.stats ?? {};
  receipt.suiteAfterHeal = { exitCode: suite.code, passed: st.expected, failed: st.unexpected };
  write(`${PROOF}/receipt.json`, receipt);
  console.log(`\n ${healed}/${rows.length} healed. Full suite after heal: ${st.expected ?? '?'} passed, ${st.unexpected ?? '?'} failed (exit ${suite.code}).`);
  console.log(` Receipt: ${PROOF}/receipt.json\n`);
  stopServer();

  const diff = (() => { try { return execFileSync('git', ['diff', '--', 'tests'], { encoding: 'utf8' }); } catch { return ''; } })();
  const branch = `relocate/heal-${Date.now()}`;
  const repo = pr ? execFileSync('gh', ['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner'], { encoding: 'utf8' }).trim() : '';
  const img = (f: string) => repo ? `https://github.com/${repo}/blob/${branch}/${PROOF}/${f}?raw=true` : `${PROOF}/${f}`;
  const body = [
    `## 🩹 Relocate: healed ${healed}/${rows.length} stale locator(s)`, '',
    '| Test | Old selector | ZeroDOM handle | New selector | Similarity | Before | After |', '|---|---|---|---|---|---|---|',
    ...rows.map(r => `| \`${r.file}:${r.line}\` | \`${r.selector}\` | \`[${r.handle}]\` | \`${r.newSelector}\` | ${r.similarity} | ❌ FAIL | ${r.post === 'PASS' ? '✅ PASS' : '❌ FAIL'} |`),
    '', 'Only locator literals changed; no assertions, expectations or test logic touched (GATE-04).', '',
    ...rows.flatMap(r => [`### #${r.n} ${r.title}`, '| Failure (ZeroDOM badges) | Healed |', '|---|---|',
      `| ![](${img(`${r.n}-failure_proof.png`)}) | ![](${img(`${r.n}-healed_proof.png`)}) |`, '']),
    '<details><summary>Diff</summary>', '', '```diff', diff.trim(), '```', '</details>', '',
    '🤖 Generated with Relocate (IBM Bob 2.0 + ZeroDOM)',
  ].join('\n');
  write(`${PROOF}/PR.md`, body);
  if (!pr) return;
  execFileSync('git', ['checkout', '-b', branch], { stdio: 'inherit' });
  execFileSync('git', ['add', 'tests', PROOF], { stdio: 'inherit' });
  execFileSync('git', ['commit', '-m', `fix(tests): heal ${healed} stale locator(s) via ZeroDOM`], { stdio: 'inherit' });
  execFileSync('git', ['push', '-u', 'origin', branch], { stdio: 'inherit' });
  execFileSync('gh', ['pr', 'create', '--title', `Relocate: heal ${healed} stale locator(s)`, '--body-file', `${PROOF}/PR.md`, ...(base ? ['--base', base] : [])], { stdio: 'inherit' });
}

function restore(n: number) {
  const { failure: f } = read<{ failure: Failure }>(`${OUT}/tasks/${n}/audit.json`);
  const orig = `${OUT}/tasks/${n}/original.line`;
  if (!existsSync(orig)) return;
  withLock(f.file, () => {
    const lines = readFileSync(f.file, 'utf8').split('\n');
    lines[f.line - 1] = readFileSync(orig, 'utf8');
    writeFileSync(f.file, lines.join('\n'));
  });
}

async function task(n: number) {
  try {
    const best = await audit(n);
    if (!best) return false;
    patch(n, 0);
    return await verify(n);
  } catch (e) { // one broken task must not sink the others
    log(`T${n}`, `\x1b[31merror: ${(e as Error).message}\x1b[0m`);
    try { restore(n); } catch {}
    return false;
  }
}

// ---------- CLI ----------
const [cmd, arg, arg2] = process.argv.slice(2);
const pr = process.argv.includes('--pr');
const base = process.argv.includes('--base') ? process.argv[process.argv.indexOf('--base') + 1] : ''; // CI: heal PR targets the redesign branch
if (import.meta.main) {
  switch (cmd) {
    case 'capture': await capture(); break;
    case 'audit': await audit(Number(arg)); break;
    case 'patch': patch(Number(arg), Number(arg2 ?? 0)); break;
    case 'verify': process.exitCode = (await verify(Number(arg))) ? 0 : 1; break;
    case 'report': await report(pr); break;
    case 'heal': {
      const failures = await capture();
      if (!failures.length) { log('heal', 'nothing to heal'); stopServer(); break; }
      log('heal', `spawning ${failures.length} concurrent tasks: ${failures.map(f => `T${f.n}`).join(', ')}`);
      await Promise.all(failures.map(f => task(f.n)));
      await report(pr);
      break;
    }
    default: console.log(readFileSync(new URL(import.meta.url), 'utf8').split('\n').slice(0, 10).join('\n'));
  }
}
