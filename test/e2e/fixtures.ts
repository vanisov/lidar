import { chromium, test as base, type BrowserContext, type Page, type Worker } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const FIXTURE_URL = 'https://lidar.test/';

type Fixtures = { context: BrowserContext; sw: Worker; page: Page; activate: () => Promise<void> };

export const test = base.extend<Fixtures>({
  context: async ({}, use) => {
    const ext = path.resolve('dist');
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      viewport: { width: 1280, height: 800 },
      args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
    });
    await context.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: FIXTURE_URL });
    await use(context);
    await context.close();
  },
  sw: async ({ context }, use) => {
    const sw = context.serviceWorkers()[0] ?? (await context.waitForEvent('serviceworker'));
    await use(sw);
  },
  page: async ({ context }, use) => {
    const html = await readFile('test/e2e/fixture.html', 'utf8');
    await context.route(`${FIXTURE_URL}**`, route =>
      route.fulfill({
        contentType: 'text/html',
        headers: { 'content-security-policy': "default-src 'self'; style-src 'self' 'nonce-fixture'" },
        body: html,
      }),
    );
    const page = await context.newPage();
    await page.goto(FIXTURE_URL);
    await use(page);
  },
  // What clicking the toolbar icon does: inject content.js, which opens or closes Lidar.
  activate: async ({ sw }, use) => {
    await use(() =>
      sw.evaluate(async url => {
        const [tab] = await chrome.tabs.query({ url: `${url}*` });
        await (globalThis as unknown as { lidarToggle(id: number): Promise<boolean> }).lidarToggle(tab.id!);
      }, FIXTURE_URL),
    );
  },
});

export const expect = test.expect;

/** Waits two animation frames so the overlay has drawn. */
export const frame = (page: Page) =>
  page.evaluate(() => new Promise<void>(r => requestAnimationFrame(() => requestAnimationFrame(() => r()))));

export const clipboardText = (page: Page) => page.evaluate(() => navigator.clipboard.readText());
