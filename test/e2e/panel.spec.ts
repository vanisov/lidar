import { clipboardText, expect, frame, test } from './fixtures';

async function pin(page: import('@playwright/test').Page, selector: string) {
  const b = (await page.locator(selector).boundingBox())!;
  await page.mouse.click(b.x + 5, b.y + 5);
  await frame(page);
  return b;
}

test('pinning fills the inspector', async ({ page, activate }) => {
  await activate();
  const panel = page.locator('lidar-root .panel');
  await expect(panel.locator('.tag')).toHaveText('Inspector');
  const b = await pin(page, '.cta');
  await expect(panel.locator('.tag')).toHaveText('a.cta');
  await expect(panel.locator('[data-row="Size"] .val')).toHaveText(`${Math.round(b.width)} × ${Math.round(b.height)}`);
  await expect(panel.locator('[data-row="Color"] .val')).toHaveText('#FFFFFF');
  await expect(panel.locator('[data-row="Background"] .val')).toHaveText('#1D1D1D');
  await expect(panel.locator('[data-row="Contrast"] .val')).toHaveText(/AAA$/);
});

test('arrow keys walk the DOM tree', async ({ page, activate }) => {
  await activate();
  await pin(page, '#c2');
  const tag = page.locator('lidar-root .panel .tag');
  await page.keyboard.press('ArrowLeft');
  await expect(tag).toHaveText('div#c1.card');
  await page.keyboard.press('ArrowUp');
  await expect(tag).toHaveText('div.row');
  await page.keyboard.press('ArrowDown');
  await expect(tag).toHaveText('div#c1.card');
  await page.keyboard.press('ArrowRight');
  await expect(tag).toHaveText('div#c2.card');
});

test('clicking a value copies it, and Copy CSS copies a rule', async ({ page, activate }) => {
  await activate();
  await pin(page, '.cta');
  const panel = page.locator('lidar-root .panel');
  await panel.locator('[data-row="Color"] .val').click();
  expect(await clipboardText(page)).toBe('#FFFFFF');
  await panel.getByRole('button', { name: 'Copy CSS' }).click();
  const css = await clipboardText(page);
  expect(css).toMatch(/^a\.cta \{/);
  expect(css).toContain('padding: 13px 22px;');
});

test('a pinned element that leaves the page clears the selection', async ({ page, activate }) => {
  await activate();
  await pin(page, '#c3');
  await page.evaluate(() => document.getElementById('c3')!.remove());
  await frame(page);
  await expect(page.locator('lidar-root .panel .tag')).toHaveText('Inspector');
  await expect(page.locator('lidar-root [data-ov="pinned"]')).toBeHidden();
});

test('the panel moves left when the pinned element is under it, and collapses', async ({ page, activate }) => {
  await page.evaluate(() => {
    const d = document.createElement('div');
    d.id = 'right';
    d.style.cssText = 'position:absolute;right:20px;top:60px;width:150px;height:80px;background:#fff';
    document.body.append(d);
  });
  await activate();
  await pin(page, '#right');
  const panel = page.locator('lidar-root .panel');
  expect((await panel.boundingBox())!.x).toBeLessThan(200);
  await panel.getByRole('button', { name: 'Collapse' }).click();
  await expect(panel.locator('.pb')).toBeHidden();
});
