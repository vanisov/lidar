import { chromium } from '@playwright/test';
import { mkdir } from 'node:fs/promises';

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="100%" height="100%">
  <rect x="4" y="4" width="120" height="120" rx="28" fill="#f4f4f5"/>
  <g fill="none" stroke="#1d1d1f" stroke-width="10" stroke-linecap="round" stroke-linejoin="round">
    <path d="M30 50V30h20M78 30h20v20M98 78v20H78M50 98H30V78"/>
  </g>
  <circle cx="64" cy="64" r="11" fill="#ff5a36"/>
</svg>`;

await mkdir('static/icons', { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage();
for (const size of [16, 32, 48, 128]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>html,body{margin:0;background:transparent}</style>${svg}`);
  await page.screenshot({ path: `static/icons/${size}.png`, omitBackground: true });
}
await browser.close();
