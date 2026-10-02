import { expect, frame, FIXTURE_URL, test } from './fixtures';

async function pinCta(page: import('@playwright/test').Page) {
  const b = (await page.locator('.cta').boundingBox())!;
  await page.mouse.click(b.x + 5, b.y + 5);
  await frame(page);
}

const clipboardItem = (page: import('@playwright/test').Page) =>
  page.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    const text = item.types.includes('text/plain') ? await (await item.getType('text/plain')).text() : '';
    return { types: item.types, text };
  });

test('Screenshot copies a PNG of the element', async ({ page, activate }) => {
  await activate();
  await pinCta(page);
  const cta = (await page.locator('.cta').boundingBox())!;
  await page.locator('lidar-root .panel').getByRole('button', { name: 'Screenshot' }).click();
  await expect.poll(async () => (await clipboardItem(page)).types).toContain('image/png');
  const { width, dpr } = await page.evaluate(async () => {
    const [item] = await navigator.clipboard.read();
    const bmp = await createImageBitmap(await item.getType('image/png'));
    return { width: bmp.width, dpr: devicePixelRatio };
  });
  expect(Math.abs(width - Math.round(cta.width * dpr))).toBeLessThanOrEqual(2);
});

test('Copy for AI copies a markdown brief and the screenshot together', async ({ page, activate }) => {
  await activate();
  await pinCta(page);
  await page.locator('lidar-root .panel').getByRole('button', { name: 'Copy for AI' }).click();
  await expect.poll(async () => (await clipboardItem(page)).types).toEqual(expect.arrayContaining(['text/plain', 'image/png']));
  const { text } = await clipboardItem(page);
  expect(text).toContain(`## \`a.cta\` on ${FIXTURE_URL}`);
  expect(text).toContain('- Selector: `');
});

test('Lidar reappears after a screenshot', async ({ page, activate }) => {
  await activate();
  await pinCta(page);
  await page.locator('lidar-root .panel').getByRole('button', { name: 'Screenshot' }).click();
  await expect(page.locator('lidar-root')).toBeVisible(); // restored after capture
});

test("Chrome's capture rate limit shows a plain retry message", async ({ page, sw, activate }) => {
  await activate();
  await pinCta(page);
  // Chrome's own error when more than two captures land in one second (seen by calling it four times at once).
  await sw.evaluate(() => {
    chrome.tabs.captureVisibleTab = (() =>
      Promise.reject(new Error('This request exceeds the MAX_CAPTURE_VISIBLE_TAB_CALLS_PER_SECOND quota.'))) as typeof chrome.tabs.captureVisibleTab;
  });
  await page.locator('lidar-root .panel').getByRole('button', { name: 'Screenshot' }).click();
  await expect(page.locator('lidar-root .toast')).toHaveText('Try again in a moment');
});
