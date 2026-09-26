import { test, expect } from './fixture';

test('cart link opens the cart', async ({ page }) => {
  await page.goto('/');
  await page.locator('a.nav-link--cart').click();
  await expect(page.locator('h1')).toHaveText('Your cart');
});
