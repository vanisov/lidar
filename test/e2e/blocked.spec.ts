import { expect, test } from './fixtures';

test("on a page Chrome keeps extensions out of, the toggle explains instead of opening", async ({ context, sw }) => {
  const page = await context.newPage();
  await page.goto('chrome://version');
  const result = await sw.evaluate(async () => {
    const [tab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true }); // chrome:// URLs don't match url patterns
    const g = globalThis as unknown as { lidarToggle(id: number): Promise<boolean> };
    const opened = await g.lidarToggle(tab.id!);
    return {
      opened,
      badge: await chrome.action.getBadgeText({ tabId: tab.id! }),
      // The popup is only set while it opens, so later clicks on allowed pages still toggle Lidar.
      popup: await chrome.action.getPopup({ tabId: tab.id! }),
    };
  });
  expect(result).toEqual({ opened: false, badge: '–', popup: '' });
});

test('the blocked popup says why, and offers the file-access setting on local files', async ({ context, sw }) => {
  const base = sw.url().replace('background.js', 'blocked.html');
  const page = await context.newPage();

  await page.goto(base);
  await expect(page.getByRole('heading')).toHaveText("Lidar can't run on this page");
  await expect(page.getByText('Chrome Web Store')).toBeVisible();
  await expect(page.getByRole('button', { name: "Open Lidar's details" })).toBeHidden();

  await page.goto(`${base}?file`);
  await expect(page.getByText('Allow access to file URLs')).toBeVisible();
  await expect(page.getByText('Chrome Web Store')).toBeHidden();
  await expect(page.getByRole('button', { name: "Open Lidar's details" })).toBeVisible();
});
