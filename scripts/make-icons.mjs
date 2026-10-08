import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';

const full = await readFile('brand/icon.svg', 'utf8');
const small = await readFile('brand/icon-16.svg', 'utf8');

await mkdir('static/icons', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
// Chrome's guideline: 96 px of artwork in the 128 px icon (48 px keeps that ratio); toolbar sizes inset only a little.
const PAD = { 16: 1, 32: 2, 48: 6, 128: 16 };
for (const size of [16, 32, 48, 128]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}body{box-sizing:border-box;width:100vw;height:100vh;padding:${PAD[size]}px}svg{display:block;width:100%;height:100%}</style>${size === 16 ? small : full}`);
  await page.screenshot({ path: `static/icons/${size}.png`, omitBackground: true });
}
await browser.close();
