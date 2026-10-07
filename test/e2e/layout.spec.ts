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
  await activate(); // close
  await activate(); // reopen
  await expect(page.locator('lidar-root [data-tool="xray"]')).toHaveAttribute('aria-pressed', 'true');
  await expect.poll(async () => (await scene(page)).outlines).toBeGreaterThan(5);
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

test('the top ruler marks the page breakpoints and names them on hover', async ({ page, activate }) => {
  await activate();
  const tick = page.locator('lidar-root [data-ov="bp"]');
  await expect(tick).toHaveCount(2); // 768, and 1100 from a nested rule
  const b = (await tick.first().boundingBox())!;
  expect(Math.abs(b.x + b.width / 2 - 768)).toBeLessThan(1.5);
  await expect(page.locator('lidar-root [data-ov="bp-range"]')).toBeVisible(); // 1100 → 1280 is the current range
  await page.mouse.move(769, 9);
  await expect(page.locator('lidar-root [data-ov="bp-tip"]')).toHaveText('@media (min-width: 768px)');
  await page.keyboard.press('r'); // rulers off hides breakpoints too
  await expect(tick.first()).toBeHidden();
  await expect(tick.last()).toBeHidden();
});

test('/ finds elements by selector; arrows step and Enter pins', async ({ page, activate }) => {
  await activate();
  await page.keyboard.press('/');
  const bar = page.locator('lidar-root .search');
  await page.keyboard.type('.card');
  await expect(bar.locator('.n')).toHaveText('1 of 3');
  await expect.poll(async () => (await scene(page)).strong).toBe(1);
  await page.keyboard.press('ArrowDown');
  await expect(bar.locator('.n')).toHaveText('2 of 3');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp'); // wraps to the last
  await expect(bar.locator('.n')).toHaveText('3 of 3');
  await page.keyboard.press('Enter');
  await expect(bar).toHaveCount(0);
  await expect(page.locator('lidar-root .panel .tag')).toHaveText('div#c3.card');
});

test('search reports bad and empty results, and typing never triggers tool keys', async ({ page, activate }) => {
  await activate();
  await page.keyboard.press('/');
  const n = page.locator('lidar-root .search .n');
  await page.keyboard.type('.grid');
  await expect(n).toHaveText('1 of 1');
  await expect(page.locator('lidar-root [data-tool="grid"]')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('lidar-root .search input').fill('[[');
  await expect(n).toHaveText('Not a valid selector');
  await page.locator('lidar-root .search input').fill('meta'); // matches, but isn't rendered
  await expect(n).toHaveText('No matches');
});

test('keys typed into the search never reach the page', async ({ page, activate }) => {
  await page.evaluate(() => {
    (window as any).__pageKeys = [];
    document.addEventListener('keydown', e => (window as any).__pageKeys.push(e.key));
  });
  await activate();
  await page.keyboard.press('/');
  await page.keyboard.type('.card');
  await expect(page.locator('lidar-root .search .n')).toHaveText('1 of 3');
  const keys: string[] = await page.evaluate(() => (window as any).__pageKeys);
  for (const k of ['.', 'c', 'a', 'r', 'd']) expect(keys).not.toContain(k);
});

test('Esc closes the search first, then Lidar, leaving the DOM exactly as it was', async ({ page, activate }) => {
  const before = await page.evaluate(() => document.documentElement.outerHTML);
  await activate();
  await page.keyboard.press('g');
  await page.keyboard.press('x');
  await page.keyboard.press('/');
  await page.keyboard.type('.card');
  await page.keyboard.press('Escape');
  await expect(page.locator('lidar-root .search')).toHaveCount(0);
  await expect(page.locator('lidar-root .dock')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('lidar-root')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.outerHTML)).toBe(before);
});

test('typing a search scrolls the first match into view', async ({ page, activate }) => {
  await activate();
  await page.keyboard.press('/');
  await page.keyboard.type('#wrap');
  await expect(page.locator('#wrap')).toBeInViewport();
});

test('line numbers are not drawn for a pinned grid that is off-screen', async ({ page, activate }) => {
  await page.locator('#grid').scrollIntoViewIfNeeded();
  await activate();
  const b = (await page.locator('#grid').boundingBox())!;
  await page.mouse.click(b.x + 4, b.y + 4); // pin the container
  await expect(page.locator('lidar-root .lnum:visible').first()).toBeVisible();
  await page.evaluate(() => scrollTo(0, 0));
  await expect(page.locator('lidar-root .lnum:visible')).toHaveCount(0);
});
