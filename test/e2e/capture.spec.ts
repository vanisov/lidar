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
  await page.locator('lidar-root .panel').getByRole('button', { name: 'Screenshot' }).click();
  await expect.poll(async () => (await clipboardItem(page)).types).toContain('image/png');
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
