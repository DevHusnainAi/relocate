import { test, expect } from './fixture';

test('checkout places an order', async ({ page }) => {
  await page.goto('/');
  await page.locator('input.field--email').fill('dev@acme.io');
  await page.locator('#place-order').click();
  await expect(page.locator('#status')).toHaveText('Order placed');
});
