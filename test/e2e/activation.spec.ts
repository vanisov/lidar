import { expect, test } from './fixtures';

test('the toolbar toggle opens and closes Lidar', async ({ page, activate }) => {
  await activate();
  await expect(page.locator('lidar-root .dock')).toBeVisible();
  await activate();
  await expect(page.locator('lidar-root')).toHaveCount(0);
  await activate();
  await expect(page.locator('lidar-root')).toHaveCount(1);
});

test('Esc closes Lidar and leaves the page DOM exactly as it was', async ({ page, activate }) => {
  const before = await page.evaluate(() => document.documentElement.outerHTML);
  await activate();
  await page.mouse.move(300, 300);
  await page.keyboard.press('Escape');
  await expect(page.locator('lidar-root')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.outerHTML)).toBe(before);
});

test('Lidar is styled under a strict CSP and ignores hostile page CSS', async ({ page, activate }) => {
  await page.evaluate(() => scrollTo(0, 600));
  await activate();
  const dock = page.locator('lidar-root .dock');
  await expect(dock).toHaveCSS('background-color', 'rgb(31, 31, 31)');
  expect(await dock.evaluate(el => getComputedStyle(el).fontFamily)).not.toContain('Comic Sans');
  const box = (await dock.boundingBox())!;
  expect(box.y + box.height).toBeGreaterThan(800 - 40);
  expect(box.y + box.height).toBeLessThanOrEqual(800);
});

test('tool keys switch the active tool', async ({ page, activate }) => {
  await activate();
  await page.keyboard.press('d');
  await expect(page.locator('lidar-root [data-tool="distance"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('lidar-root [data-tool="measure"]')).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('m');
  await expect(page.locator('lidar-root [data-tool="measure"]')).toHaveAttribute('aria-pressed', 'true');
});

test('a toast from one session is gone when Lidar reopens', async ({ page, activate }) => {
  await activate();
  await page.keyboard.press('r');
  await expect(page.locator('lidar-root .toast')).toHaveClass(/show/);
  await page.keyboard.press('Escape');
  await expect(page.locator('lidar-root')).toHaveCount(0);
  await activate();
  await expect(page.locator('lidar-root .toast')).not.toHaveClass(/show/);
  await expect(page.locator('lidar-root .toast')).toHaveText(''); // no stale message either
});

test('page fields keep their keystrokes while Lidar is open', async ({ page, activate }) => {
  await page.locator('#q').focus();
  await activate();
  await page.keyboard.type('md');
  await expect(page.locator('#q')).toHaveValue('md');
  await expect(page.locator('lidar-root [data-tool="measure"]')).toHaveAttribute('aria-pressed', 'true');
});
