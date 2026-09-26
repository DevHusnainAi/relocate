import { test, expect } from './fixture';

test('checkout places an order', async ({ page }) => {
  await page.goto('/');
  await page.locator('input.field--email').fill('dev@acme.io');
  await page.locator('#checkout-submit').click();
  await expect(page.locator('#status')).toHaveText('Order placed');
});
