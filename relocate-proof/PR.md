## 🩹 Relocate: healed 12/12 stale locator(s)

| Test | Old selector | ZeroDOM handle | New selector | Similarity | Before | After |
|---|---|---|---|---|---|---|
| `tests/admin.spec.ts:6` | `getByTestId('save-btn')` | `[node_06]` | `getByTestId('save-button')` | 0.36 | ❌ FAIL | ✅ PASS |
| `tests/admin.spec.ts:11` | `getByRole('button', { name: 'Delete' })` | `[node_05]` | `getByRole('button', { name: 'Remove' })` | 0.42 | ❌ FAIL | ✅ PASS |
| `tests/admin.spec.ts:16` | `#user-2 .edit-btn` | `[node_03]` | `locator('tr').filter({ hasText: 'Beta' }).getByRole('button', { name: 'Edit' })` | 0.38 | ❌ FAIL | ✅ PASS |
| `tests/admin.spec.ts:21` | `getByPlaceholder('Search users')` | `[node_01]` | `getByPlaceholder('Search members')` | 0.36 | ❌ FAIL | ✅ PASS |
| `tests/checkout.spec.ts:6` | `button#submit-v1` | `[node_06]` | `locator('#place-order')` | 0.58 | ❌ FAIL | ✅ PASS |
| `tests/nav.spec.ts:5` | `nav > a.cart-link` | `[node_02]` | `locator('a.nav-link--cart')` | 0.73 | ❌ FAIL | ✅ PASS |
| `tests/promo.spec.ts:5` | `input.promo-input` | `[node_04]` | `locator('input[name="promo"]')` | 0.45 | ❌ FAIL | ✅ PASS |
| `tests/spa.spec.ts:6` | `button._primary_DzAMk` | `[node_08]` | `getByRole('button', { name: 'Save changes' })` | 0.25 | ❌ FAIL | ✅ PASS |
| `tests/spa.spec.ts:11` | `getByRole('button', { name: 'Delete member' })` | `[node_05]` | `getByRole('button', { name: 'Remove from team' })` | 0.46 | ❌ FAIL | ✅ PASS |
| `tests/spa.spec.ts:17` | `getByTestId('invite-submit')` | `[node_07]` | `getByTestId('invite-form-send')` | 0.3 | ❌ FAIL | ✅ PASS |
| `tests/spa.spec.ts:22` | `#member-2 .edit` | `[node_03]` | `locator('li').filter({ hasText: 'Beta' }).getByRole('button', { name: 'Edit' })` | 0.45 | ❌ FAIL | ✅ PASS |
| `tests/spa.spec.ts:27` | `getByPlaceholder('Search members')` | `[node_01]` | `getByPlaceholder('Find a teammate')` | 0.2 | ❌ FAIL | ✅ PASS |

Only locator literals changed; no assertions, expectations or test logic touched (GATE-04).

### #1 saves settings
| Failure (ZeroDOM badges) | Healed |
|---|---|
| ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/1-failure_proof.png?raw=true) | ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/1-healed_proof.png?raw=true) |

### #2 deletes the last user
| Failure (ZeroDOM badges) | Healed |
|---|---|
| ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/2-failure_proof.png?raw=true) | ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/2-healed_proof.png?raw=true) |

### #3 edits the second user
| Failure (ZeroDOM badges) | Healed |
|---|---|
| ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/3-failure_proof.png?raw=true) | ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/3-healed_proof.png?raw=true) |

### #4 searches members
| Failure (ZeroDOM badges) | Healed |
|---|---|
| ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/4-failure_proof.png?raw=true) | ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/4-healed_proof.png?raw=true) |

### #5 checkout places an order
| Failure (ZeroDOM badges) | Healed |
|---|---|
| ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/5-failure_proof.png?raw=true) | ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/5-healed_proof.png?raw=true) |

### #6 cart link opens the cart
| Failure (ZeroDOM badges) | Healed |
|---|---|
| ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/6-failure_proof.png?raw=true) | ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/6-healed_proof.png?raw=true) |

### #7 promo code is accepted
| Failure (ZeroDOM badges) | Healed |
|---|---|
| ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/7-failure_proof.png?raw=true) | ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/7-healed_proof.png?raw=true) |

### #8 saves team settings
| Failure (ZeroDOM badges) | Healed |
|---|---|
| ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/8-failure_proof.png?raw=true) | ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/8-healed_proof.png?raw=true) |

### #9 removes the last member
| Failure (ZeroDOM badges) | Healed |
|---|---|
| ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/9-failure_proof.png?raw=true) | ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/9-healed_proof.png?raw=true) |

### #10 sends an invite
| Failure (ZeroDOM badges) | Healed |
|---|---|
| ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/10-failure_proof.png?raw=true) | ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/10-healed_proof.png?raw=true) |

### #11 edits the second member
| Failure (ZeroDOM badges) | Healed |
|---|---|
| ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/11-failure_proof.png?raw=true) | ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/11-healed_proof.png?raw=true) |

### #12 filters members
| Failure (ZeroDOM badges) | Healed |
|---|---|
| ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/12-failure_proof.png?raw=true) | ![](https://github.com/DevHusnainAi/relocate/blob/relocate/heal-1790423615083/relocate-proof/12-healed_proof.png?raw=true) |

<details><summary>Diff</summary>

```diff
diff --git a/tests/admin.spec.ts b/tests/admin.spec.ts
index e4b4695..2e2dad6 100644
--- a/tests/admin.spec.ts
+++ b/tests/admin.spec.ts
@@ -3,21 +3,21 @@ import { test, expect } from './fixture';
 test.beforeEach(async ({ page }) => { await page.goto('/admin.html'); });
 
 test('saves settings', async ({ page }) => {
-  await page.getByTestId('save-btn').click();
+  await page.getByTestId('save-button').click();
   await expect(page.locator('#toast')).toHaveText('Settings saved');
 });
 
 test('deletes the last user', async ({ page }) => {
-  await page.getByRole('button', { name: 'Delete' }).click();
+  await page.getByRole('button', { name: 'Remove' }).click();
   await expect(page.locator('#toast')).toHaveText('User removed');
 });
 
 test('edits the second user', async ({ page }) => {
-  await page.locator('#user-2 .edit-btn').click();
+  await page.locator('tr').filter({ hasText: 'Beta' }).getByRole('button', { name: 'Edit' }).click();
   await expect(page.locator('#editing')).toHaveText('Editing Beta');
 });
 
 test('searches members', async ({ page }) => {
-  await page.getByPlaceholder('Search users').fill('beta');
+  await page.getByPlaceholder('Search members').fill('beta');
   await expect(page.locator('#query')).toHaveText('beta');
 });
diff --git a/tests/checkout.spec.ts b/tests/checkout.spec.ts
index 04fe425..8d97b34 100644
--- a/tests/checkout.spec.ts
+++ b/tests/checkout.spec.ts
@@ -3,6 +3,6 @@ import { test, expect } from './fixture';
 test('checkout places an order', async ({ page }) => {
   await page.goto('/');
   await page.locator('input.field--email').fill('dev@acme.io');
-  await page.locator('button#submit-v1').click();
+  await page.locator('#place-order').click();
   await expect(page.locator('#status')).toHaveText('Order placed');
 });
diff --git a/tests/nav.spec.ts b/tests/nav.spec.ts
index 8d9f7aa..c83554c 100644
--- a/tests/nav.spec.ts
+++ b/tests/nav.spec.ts
@@ -2,6 +2,6 @@ import { test, expect } from './fixture';
 
 test('cart link opens the cart', async ({ page }) => {
   await page.goto('/');
-  await page.locator('nav > a.cart-link').click();
+  await page.locator('a.nav-link--cart').click();
   await expect(page.locator('h1')).toHaveText('Your cart');
 });
diff --git a/tests/promo.spec.ts b/tests/promo.spec.ts
index 50935c0..67f4d54 100644
--- a/tests/promo.spec.ts
+++ b/tests/promo.spec.ts
@@ -2,6 +2,6 @@ import { test, expect } from './fixture';
 
 test('promo code is accepted', async ({ page }) => {
   await page.goto('/');
-  await page.locator('input.promo-input').fill('SAVE10');
+  await page.locator('input[name="promo"]').fill('SAVE10');
   await expect(page.locator('input[name=promo]')).toHaveValue('SAVE10');
 });
diff --git a/tests/spa.spec.ts b/tests/spa.spec.ts
index e3dbffd..e30bbe6 100644
--- a/tests/spa.spec.ts
+++ b/tests/spa.spec.ts
@@ -3,27 +3,27 @@ import { test, expect } from './fixture';
 test.beforeEach(async ({ page }) => { await page.goto('/spa/'); });
 
 test('saves team settings', async ({ page }) => {
-  await page.locator('button._primary_DzAMk').click();
+  await page.getByRole('button', { name: 'Save changes' }).click();
   await expect(page.locator('#toast')).toHaveText('Settings saved');
 });
 
 test('removes the last member', async ({ page }) => {
-  await page.getByRole('button', { name: 'Delete member' }).click();
+  await page.getByRole('button', { name: 'Remove from team' }).click();
   await expect(page.locator('#toast')).toHaveText('Member removed');
 });
 
 test('sends an invite', async ({ page }) => {
   await page.locator('input[type=email]').fill('new@acme.io');
-  await page.getByTestId('invite-submit').click();
+  await page.getByTestId('invite-form-send').click();
   await expect(page.locator('#toast')).toHaveText('Invite sent');
 });
 
 test('edits the second member', async ({ page }) => {
-  await page.locator('#member-2 .edit').click();
+  await page.locator('li').filter({ hasText: 'Beta' }).getByRole('button', { name: 'Edit' }).click();
   await expect(page.locator('#editing')).toHaveText('Editing Beta');
 });
 
 test('filters members', async ({ page }) => {
-  await page.getByPlaceholder('Search members').fill('bet');
+  await page.getByPlaceholder('Find a teammate').fill('bet');
   await expect(page.locator('#query')).toHaveText('bet');
 });
```
</details>

🤖 Generated with Relocate (IBM Bob 2.0 + ZeroDOM)