import { chromium } from '@playwright/test';
import { mkdir, readFile } from 'node:fs/promises';

// brand/icon.svg is the icon; brand/icon-16.svg is its simplified cut for the 16 px toolbar size.
const full = await readFile('brand/icon.svg', 'utf8');
const small = await readFile('brand/icon-16.svg', 'utf8');

await mkdir('static/icons', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
// Transparent padding around the tile. Chrome's guideline for the 128 px store and extensions-page icon is 96 px of
// artwork inside it, and 48 px (the extensions page) keeps that ratio. The toolbar sizes only inset a little, so
// the tile sits beside other toolbar icons instead of filling its whole slot.
const PAD = { 16: 1, 32: 2, 48: 6, 128: 16 };
for (const size of [16, 32, 48, 128]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}body{box-sizing:border-box;width:100vw;height:100vh;padding:${PAD[size]}px}svg{display:block;width:100%;height:100%}</style>${size === 16 ? small : full}`);
  await page.screenshot({ path: `static/icons/${size}.png`, omitBackground: true });
}
await browser.close();
