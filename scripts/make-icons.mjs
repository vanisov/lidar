import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';

// brand/icon.svg is the icon; brand/icon-16.svg is its simplified cut for the 16 px toolbar size.
const full = await readFile('brand/icon.svg', 'utf8');
const small = await readFile('brand/icon-16.svg', 'utf8');

await mkdir('static/icons', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const size of [16, 32, 48, 128]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}svg{display:block;width:100%;height:100%}</style>${size === 16 ? small : full}`);
  await page.screenshot({ path: `static/icons/${size}.png`, omitBackground: true });
}
await browser.close();
