import type { Page } from '@playwright/test';
import { expect, frame, test } from './fixtures';

/** A point in the 20px gap between cards #c1 and #c2, 8px right of #c1. */
async function gap(page: Page) {
  const c1 = (await page.locator('#c1').boundingBox())!;
  const c2 = (await page.locator('#c2').boundingBox())!;
  return { left: 8, right: Math.round(c2.x - (c1.x + c1.width)) - 8, x: Math.round(c1.x + c1.width) + 8, y: Math.round(c1.y + c1.height / 2) };
}
const stop = (page: Page, dir: string) => page.locator(`lidar-root [data-ov="spread-${dir}"]`);
const spreadBtn = (page: Page) => page.locator('lidar-root [data-tool="spread"]');

test('Spread in Visual mode stops at the cards on either side of a gap', async ({ page, activate }) => {
  await activate();
  const g = await gap(page);
  await page.mouse.move(g.x, g.y);
  await page.keyboard.press('s');
  await expect(spreadBtn(page)).toHaveAttribute('aria-pressed', 'true');
  await expect(spreadBtn(page).locator('.badge')).toHaveText('V');
  await page.mouse.move(g.x, g.y + 1);
  await expect(stop(page, 'left')).toHaveText(String(g.left));
  await expect(stop(page, 'right')).toHaveText(String(g.right));
});

test('Spread in Layout mode stops at element boxes, and S switches modes', async ({ page, activate }) => {
  await activate();
  const g = await gap(page);
  await page.mouse.move(g.x, g.y);
  await page.keyboard.press('s');
  await page.keyboard.press('s');
  await expect(spreadBtn(page).locator('.badge')).toHaveText('L');
  await expect(page.locator('lidar-root .toast')).toHaveText('Spread: Layout');
  await page.mouse.move(g.x, g.y + 1);
  await frame(page);
  await expect(stop(page, 'left')).toHaveText(String(g.left));
  await expect(stop(page, 'right')).toHaveText(String(g.right));
  await expect(stop(page, 'gap')).toHaveText(/^20 × /);
});

test('the Spread mode is remembered across sessions', async ({ page, activate }) => {
  await activate();
  await page.keyboard.press('s');
  await page.keyboard.press('s');
  await expect(spreadBtn(page).locator('.badge')).toHaveText('L');
  await activate(); // close
  await activate(); // reopen
  await expect(spreadBtn(page).locator('.badge')).toHaveText('L');
});

test('holding Shift in Measure mode spreads lines temporarily', async ({ page, activate }) => {
  await activate();
  const g = await gap(page);
  await page.keyboard.down('Shift');
  await page.mouse.move(g.x, g.y);
  await page.mouse.move(g.x, g.y + 1);
  await expect(stop(page, 'left')).toBeVisible();
  await page.keyboard.up('Shift');
  await page.mouse.move(g.x, g.y + 2);
  await frame(page);
  await expect(stop(page, 'left')).toBeHidden();
  await expect(page.locator('lidar-root [data-tool="measure"]')).toHaveAttribute('aria-pressed', 'true');
});
