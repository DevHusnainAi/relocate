## 🩹 Relocate: healed 4/4 stale locator(s)

| Test | Old selector | ZeroDOM handle | New selector | Similarity | Before | After |
|---|---|---|---|---|---|---|
| `tests/admin.spec.ts:6` | `getByTestId('save-button')` | `[node_06]` | `getByTestId('settings-save')` | 0.55 | ❌ FAIL | ✅ PASS |
| `tests/admin.spec.ts:21` | `getByPlaceholder('Search members')` | `[node_01]` | `getByPlaceholder('Search people')` | 0.3 | ❌ FAIL | ✅ PASS |
| `tests/checkout.spec.ts:6` | `#place-order` | `[node_06]` | `locator('#checkout-submit')` | 0.64 | ❌ FAIL | ✅ PASS |
| `tests/nav.spec.ts:5` | `a.nav-link--cart` | `[node_02]` | `locator('a.nav__cart')` | 0.55 | ❌ FAIL | ✅ PASS |

Only locator literals changed; no assertions, expectations or test logic touched (GATE-04).

### #1 saves settings
| Failure (ZeroDOM badges) | Healed |
|---|---|
| ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790442535760/relocate-proof/1-failure_proof.png?raw=true) | ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790442535760/relocate-proof/1-healed_proof.png?raw=true) |

### #2 searches members
| Failure (ZeroDOM badges) | Healed |
|---|---|
| ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790442535760/relocate-proof/2-failure_proof.png?raw=true) | ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790442535760/relocate-proof/2-healed_proof.png?raw=true) |

### #3 checkout places an order
| Failure (ZeroDOM badges) | Healed |
|---|---|
| ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790442535760/relocate-proof/3-failure_proof.png?raw=true) | ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790442535760/relocate-proof/3-healed_proof.png?raw=true) |

### #4 cart link opens the cart
| Failure (ZeroDOM badges) | Healed |
|---|---|
| ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790442535760/relocate-proof/4-failure_proof.png?raw=true) | ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790442535760/relocate-proof/4-healed_proof.png?raw=true) |

<details><summary>Diff</summary>

```diff
diff --git a/tests/admin.spec.ts b/tests/admin.spec.ts
index 2e2dad6..1854e7f 100644
--- a/tests/admin.spec.ts
+++ b/tests/admin.spec.ts
@@ -3,7 +3,7 @@ import { test, expect } from './fixture';
 test.beforeEach(async ({ page }) => { await page.goto('/admin.html'); });
 
 test('saves settings', async ({ page }) => {
-  await page.getByTestId('save-button').click();
+  await page.getByTestId('settings-save').click();
   await expect(page.locator('#toast')).toHaveText('Settings saved');
 });
 
@@ -18,6 +18,6 @@ test('edits the second user', async ({ page }) => {
 });
 
 test('searches members', async ({ page }) => {
-  await page.getByPlaceholder('Search members').fill('beta');
+  await page.getByPlaceholder('Search people').fill('beta');
   await expect(page.locator('#query')).toHaveText('beta');
 });
diff --git a/tests/checkout.spec.ts b/tests/checkout.spec.ts
index 8d97b34..b9bef1e 100644
--- a/tests/checkout.spec.ts
+++ b/tests/checkout.spec.ts
@@ -3,6 +3,6 @@ import { test, expect } from './fixture';
 test('checkout places an order', async ({ page }) => {
   await page.goto('/');
   await page.locator('input.field--email').fill('dev@acme.io');
-  await page.locator('#place-order').click();
+  await page.locator('#checkout-submit').click();
   await expect(page.locator('#status')).toHaveText('Order placed');
 });
diff --git a/tests/nav.spec.ts b/tests/nav.spec.ts
index c83554c..864f59d 100644
--- a/tests/nav.spec.ts
+++ b/tests/nav.spec.ts
@@ -2,6 +2,6 @@ import { test, expect } from './fixture';
 
 test('cart link opens the cart', async ({ page }) => {
   await page.goto('/');
-  await page.locator('a.nav-link--cart').click();
+  await page.locator('a.nav__cart').click();
   await expect(page.locator('h1')).toHaveText('Your cart');
 });
```
</details>

🤖 Generated with Relocate (IBM Bob 2.0 + ZeroDOM)