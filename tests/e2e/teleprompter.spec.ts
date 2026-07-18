import { expect, test } from '@playwright/test';

test('persists a local script and can enter and exit presentation mode', async ({ page }) => {
  await page.goto('/en/');

  const editor = page.locator('textarea.tp-editor');
  await editor.fill('A script that stays on this device.');
  await expect(page.getByRole('button', { name: 'Start' })).toBeEnabled();

  await page.reload();
  await expect(editor).toHaveValue('A script that stays on this device.');

  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('.tp-stage')).toBeVisible();
  await expect(page.locator('.tp-countdown')).toHaveText('3');

  await page.keyboard.press('Escape');
  await expect(page.locator('.tp-stage')).toHaveCount(0);
});
