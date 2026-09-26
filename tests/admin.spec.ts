import { test, expect } from './fixture';

test.beforeEach(async ({ page }) => { await page.goto('/admin.html'); });

test('saves settings', async ({ page }) => {
  await page.getByTestId('settings-save').click();
  await expect(page.locator('#toast')).toHaveText('Settings saved');
});

test('deletes the last user', async ({ page }) => {
  await page.getByRole('button', { name: 'Remove' }).click();
  await expect(page.locator('#toast')).toHaveText('User removed');
});

test('edits the second user', async ({ page }) => {
  await page.locator('tr').filter({ hasText: 'Beta' }).getByRole('button', { name: 'Edit' }).click();
  await expect(page.locator('#editing')).toHaveText('Editing Beta');
});

test('searches members', async ({ page }) => {
  await page.getByPlaceholder('Search people').fill('beta');
  await expect(page.locator('#query')).toHaveText('beta');
});
