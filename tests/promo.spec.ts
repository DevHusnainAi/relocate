import { test, expect } from './fixture';

test('promo code is accepted', async ({ page }) => {
  await page.goto('/');
  await page.locator('input.promo-input').fill('SAVE10');
  await expect(page.locator('input[name=promo]')).toHaveValue('SAVE10');
});
