import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

/** Counts per Scene list, as the test build writes them on the canvas. */
const scene = (page: Page) =>
  page.locator('lidar-root [data-ov="paint"]').evaluate(c => JSON.parse((c as HTMLElement).dataset.scene ?? '{}'));

test('G shows the column grid, and it stays on next time', async ({ page, activate }) => {
  await activate();
  await page.keyboard.press('g');
  await expect.poll(async () => (await scene(page)).fills).toBe(12);
  await expect(page.locator('lidar-root [data-tool="grid"]')).toHaveAttribute('aria-pressed', 'true');
  await activate(); // close
  await activate(); // reopen
  await expect.poll(async () => (await scene(page)).fills).toBe(12);
  await page.keyboard.press('g');
  await expect.poll(async () => (await scene(page)).fills).toBe(0);
});

test('X outlines every visible element', async ({ page, activate }) => {
  await activate();
  await page.keyboard.press('x');
  await expect.poll(async () => (await scene(page)).outlines).toBeGreaterThan(5);
  await expect(page.locator('lidar-root [data-tool="xray"]')).toHaveAttribute('aria-pressed', 'true');
});
