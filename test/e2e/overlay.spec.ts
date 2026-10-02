import { expect, frame, FIXTURE_URL, test } from './fixtures';

const near = (a: number, b: number) => expect(Math.abs(a - b)).toBeLessThan(1);

test('hovering an element outlines it and shows its size', async ({ page, activate }) => {
  await activate();
  const b = (await page.locator('.cta').boundingBox())!;
  await page.mouse.move(b.x + 5, b.y + 5);
  await frame(page);
  const hl = (await page.locator('lidar-root [data-ov="hover"]').boundingBox())!;
  near(hl.x, b.x); near(hl.y, b.y); near(hl.width, b.width); near(hl.height, b.height);
  await expect(page.locator('lidar-root [data-ov="size"]')).toHaveText(`${Math.round(b.width)} × ${Math.round(b.height)}`);
});

test('clicking pins an element without triggering the page', async ({ page, activate }) => {
  await activate();
  const b = (await page.locator('.cta').boundingBox())!;
  await page.mouse.click(b.x + 5, b.y + 5);
  await frame(page);
  expect(page.url()).toBe(FIXTURE_URL);
  near((await page.locator('lidar-root [data-ov="pinned"]').boundingBox())!.x, b.x);
  expect(await page.evaluate(() => document.activeElement === document.body)).toBe(true);
});

test('holding Alt shows the gap between the pinned and hovered elements', async ({ page, activate }) => {
  await activate();
  const c1 = (await page.locator('#c1').boundingBox())!;
  const c2 = (await page.locator('#c2').boundingBox())!;
  await page.mouse.click(c1.x + 5, c1.y + 5);
  await page.keyboard.down('Alt');
  await page.mouse.move(c2.x + 5, c2.y + 5);
  await frame(page);
  await expect(page.locator('lidar-root [data-ov="dist-0"]')).toHaveText(String(Math.round(c2.x - (c1.x + c1.width))));
  await page.keyboard.up('Alt');
});

test('the outline follows the element after the page scrolls', async ({ page, activate }) => {
  await activate();
  await page.mouse.move(300, 400);
  await page.mouse.wheel(0, 300);
  await page.waitForFunction(() => scrollY >= 300);
  const b = (await page.locator('#tall').boundingBox())!;
  await page.mouse.move(300, 401);
  await frame(page);
  near((await page.locator('lidar-root [data-ov="hover"]').boundingBox())!.y, b.y);
});

test('the size label stays on screen for elements taller than the viewport', async ({ page, activate }) => {
  await page.evaluate(() => scrollTo(0, 400));
  await activate();
  await page.mouse.move(300, 400);
  await frame(page);
  const size = page.locator('lidar-root [data-ov="size"]');
  await expect(size).toHaveText(/× 2400$/);
  const box = (await size.boundingBox())!;
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(800);
});

test('rulers track the cursor and R hides them', async ({ page, activate }) => {
  await activate();
  await page.mouse.move(321, 222);
  await frame(page);
  await expect(page.locator('lidar-root [data-ov="coord"]')).toHaveText('321, 222');
  await page.keyboard.press('r');
  await frame(page);
  await expect(page.locator('lidar-root [data-ov="ruler-h"]')).toBeHidden();
});

test('"Inspect with Lidar" pins the element under the cursor', async ({ page, sw, activate }) => {
  await activate();
  await sw.evaluate(async url => {
    const [tab] = await chrome.tabs.query({ url: `${url}*` });
    await chrome.tabs.sendMessage(tab.id!, { type: 'pin-next' });
  }, FIXTURE_URL);
  const b = (await page.locator('#c1').boundingBox())!;
  await page.mouse.move(b.x + 5, b.y + 5);
  await frame(page);
  near((await page.locator('lidar-root [data-ov="pinned"]').boundingBox())!.x, b.x);
});
