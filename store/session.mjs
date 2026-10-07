// Shared by shoot.mjs and record.mjs: a Chromium with the test build of Lidar loaded, serving store/demo.html.
// Run after `npm run build:test`, which lets these scripts toggle Lidar from the service worker.
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const URL = 'https://orbit.test/';

export async function launch({ deviceScaleFactor = 1 } = {}) {
  const ext = path.resolve('dist');
  const html = await readFile('store/demo.html', 'utf8');
  const ctx = await chromium.launchPersistentContext('', {
    channel: 'chromium',
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor,
    args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
  });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: URL });
  await ctx.route(`${URL}**`, r => r.fulfill({ contentType: 'text/html', body: html }));
  const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker'));

  // Opens the demo page with Lidar active and the given settings.
  async function open(settings = {}) {
    await sw.evaluate(s => chrome.storage.sync.set({ settings: { theme: 'graphite', units: 'px', remBase: 16, rulers: true, spreadMode: 'visual', spreadTolerance: 6, ...s } }), settings);
    const page = await ctx.newPage();
    await page.goto(URL);
    await sw.evaluate(async url => {
      const [tab] = await chrome.tabs.query({ url: `${url}*` });
      await globalThis.lidarToggle(tab.id);
    }, URL);
    await page.waitForTimeout(300); // settings load + dock entrance
    return page;
  }
  return { ctx, open };
}

export const box = async (page, sel) => (await page.locator(sel).boundingBox());
export const settle = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
