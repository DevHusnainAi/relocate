import { test, expect } from './fixture';

test.beforeEach(async ({ page }) => { await page.goto('/admin.html'); });

test('saves settings', async ({ page }) => {
  await page.getByTestId('save-btn').click();
  await expect(page.locator('#toast')).toHaveText('Settings saved');
});

test('deletes the last user', async ({ page }) => {
  await page.getByRole('button', { name: 'Delete' }).click();
  await expect(page.locator('#toast')).toHaveText('User removed');
});

test('edits the second user', async ({ page }) => {
  await page.locator('#user-2 .edit-btn').click();
  await expect(page.locator('#editing')).toHaveText('Editing Beta');
});

test('searches members', async ({ page }) => {
  await page.getByPlaceholder('Search users').fill('beta');
  await expect(page.locator('#query')).toHaveText('beta');
});
