import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHtml } from '@vexralabs/zerodom';
import { rank, swapLocator, brittle } from './relocate.ts';

const html = `<form><input class="field--promo" placeholder="Promo code">
  <button class="secondary">Submit feedback</button><div><button id="place-order">Submit order</button></div></form>`;

test('auditor prefers the order button over the decoy using test context', () => {
  const { nodes } = parseHtml(html, 'http://x');
  const [best] = rank(nodes, "locator('button#submit-v1')", "checkout places an order toHaveText('Order placed')", 'click');
  assert.equal(best.label, 'Submit order');
});

test('action filter keeps fill targets only', () => {
  const { nodes } = parseHtml(html, 'http://x');
  assert.ok(rank(nodes, "locator('input.promo-input')", 'promo', 'fill').every(c => c.type === 'input'));
});

test('neighbour text breaks ties between identical buttons', () => {
  const { nodes } = parseHtml('<table><tr><td>Alpha</td><td><button>Edit</button></td></tr><tr><td>Beta</td><td><button>Edit</button></td></tr></table>', 'http://x');
  const near = Object.fromEntries(nodes.map((n, i) => [n.id, i ? 'Beta Edit' : 'Alpha Edit']));
  assert.equal(rank(nodes, "locator('#user-2 .edit-btn')", "toHaveText('Editing Beta')", 'click', near)[0].handle, nodes[1].id);
});

test('inflections match: "removed" finds the Remove button', () => {
  const { nodes } = parseHtml('<button>Cancel</button><button>Remove</button>', 'http://x');
  assert.equal(rank(nodes, "getByRole('button', { name: 'Delete' })", "toHaveText('User removed')", 'click')[0].label, 'Remove');
});

test('healer swaps only the locator expression', () => {
  const src = "a\n  await page.locator('input.x').fill('v');\nb";
  assert.equal(swapLocator(src, 2, "locator('input.x')", 'input.x', "getByPlaceholder('Promo')"), "a\n  await page.getByPlaceholder('Promo').fill('v');\nb");
  const role = "  await page.getByRole('button', { name: 'Delete' }).click();";
  assert.equal(swapLocator(role, 1, "getByRole('button', { name: 'Delete' })", '', "getByRole('button', { name: 'Remove' })"), "  await page.getByRole('button', { name: 'Remove' }).click();");
  const dq = '  await page.locator("input.x").fill(\'v\');'; // source quotes differ from Playwright's message
  assert.equal(swapLocator(dq, 1, "locator('input.x')", 'input.x', "locator('#y')"), "  await page.locator('#y').fill('v');");
  assert.throws(() => swapLocator(src, 1, "locator('input.x')", 'input.x', "locator('#y')"));
});

test('positional and build-hashed selectors count as brittle', () => {
  assert.ok(brittle('body > button:nth-of-type(2)'));
  assert.ok(brittle('button._solid_h-dyu'));
  assert.ok(brittle('button._primary_DzAMk'));
  assert.ok(!brittle('a.nav-link--cart'));
  assert.ok(!brittle('#place-order'));
});
