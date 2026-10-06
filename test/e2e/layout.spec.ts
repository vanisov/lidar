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

test('hovering a grid container draws its gaps, track edges and line numbers', async ({ page, activate }) => {
  await page.locator('#grid').scrollIntoViewIfNeeded();
  await activate();
  const b = (await page.locator('#grid').boundingBox())!;
  await page.mouse.move(b.x + 10, b.y + 5); // in the grid's padding, so the container is hovered
  await expect.poll(async () => (await scene(page)).hatches).toBe(2);
  expect((await scene(page)).dashes).toBe(3 * 2 + 1 * 2);
  await expect(page.locator('lidar-root .lnum:visible')).toHaveText(['1', '2', '3', '4', '1', '2']);
});

test('hovering a wrapping flex container draws its gaps and the line break', async ({ page, activate }) => {
  await page.locator('#wrap').scrollIntoViewIfNeeded();
  await activate();
  const b = (await page.locator('#wrap').boundingBox())!;
  await page.mouse.move(b.x + 3, b.y + 3);
  await expect.poll(async () => (await scene(page)).hatches).toBe(3);
  expect((await scene(page)).dashes).toBe(1);
  await expect(page.locator('lidar-root .lnum:visible')).toHaveCount(0);
});

test('pinning a grid lists its layout in the panel', async ({ page, activate }) => {
  await page.locator('#grid').scrollIntoViewIfNeeded();
  await activate();
  const b = (await page.locator('#grid').boundingBox())!;
  await page.mouse.click(b.x + 10, b.y + 5);
  const panel = page.locator('lidar-root .panel');
  await expect(panel.locator('[data-row="Columns"] .val')).toHaveText(/^[\d.]+px [\d.]+px [\d.]+px$/);
  await expect(panel.locator('[data-row="Gap"] .val')).toHaveText('16px');
  await page.mouse.move(5, 300); // hover elsewhere: the pinned grid stays drawn
  await expect.poll(async () => (await scene(page)).hatches).toBe(2);
});
