import { expect, frame, test } from './fixtures';

test('theme and units apply immediately and persist across sessions', async ({ page, activate }) => {
  await activate();
  const panel = page.locator('lidar-root .panel');
  await panel.getByRole('button', { name: 'Settings' }).click();
  await panel.getByRole('radio', { name: 'Light' }).click();
  await expect(page.locator('lidar-root .dock')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
  await panel.getByRole('radio', { name: 'rem' }).click();

  const b = (await page.locator('.cta').boundingBox())!;
  await page.mouse.move(b.x + 5, b.y + 5);
  await frame(page);
  await expect(page.locator('lidar-root [data-ov="size"]')).toHaveText(/^[\d.]+rem × [\d.]+rem$/);

  await activate(); // close
  await activate(); // reopen
  await expect(page.locator('lidar-root .dock')).toHaveCSS('background-color', 'rgb(255, 255, 255)');
});

test('the rem base is validated', async ({ page, activate }) => {
  await activate();
  const panel = page.locator('lidar-root .panel');
  await panel.getByRole('button', { name: 'Settings' }).click();
  await panel.getByRole('radio', { name: 'rem' }).click();
  const input = panel.getByLabel('Pixels per rem');
  const b = (await page.locator('#c1').boundingBox())!;
  const size = page.locator('lidar-root [data-ov="size"]');
  await input.fill('0');
  await page.mouse.move(b.x + 5, b.y + 5);
  await frame(page);
  await expect(size).toHaveText('12.5rem × 6.25rem');
  await input.blur();
  await expect(input).toHaveValue('16');
  await input.fill('10');
  await page.mouse.move(b.x + 6, b.y + 6);
  await frame(page);
  await expect(page.locator('lidar-root [data-ov="size"]')).toHaveText('20rem × 10rem');
});
