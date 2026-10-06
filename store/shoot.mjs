// Renders the Chrome Web Store screenshots (1280×800) and promo tiles from store/demo.html.
// Run with `npm run store` (it builds the test bundle first, which lets this script open Lidar).
import { chromium } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

const URL = 'https://fieldnote.test/';
const ext = path.resolve('dist');
const out = name => path.join('store/out', name);
const html = await readFile('store/demo.html', 'utf8');

const ctx = await chromium.launchPersistentContext('', {
  channel: 'chromium',
  viewport: { width: 1280, height: 800 },
  args: [`--disable-extensions-except=${ext}`, `--load-extension=${ext}`],
});
await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: URL });
await ctx.route(`${URL}**`, r => r.fulfill({ contentType: 'text/html', body: html }));
const sw = ctx.serviceWorkers()[0] ?? (await ctx.waitForEvent('serviceworker'));

const settle = page => page.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));

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
const box = async (page, sel) => (await page.locator(sel).boundingBox());
const collapse = page => page.locator('lidar-root .panel').getByRole('button', { name: 'Collapse' }).click();
async function pin(page, sel, dx = 8, dy = 8) {
  const b = await box(page, sel);
  await page.mouse.click(b.x + dx, b.y + dy);
  await settle(page);
}

// 1. Inspect: pinned CTA with the full inspector.
{
  const page = await open();
  await pin(page, '#cta');
  const b = await box(page, '.btn.ghost');
  await page.mouse.move(b.x + 30, b.y + 20);
  await page.waitForTimeout(250);
  await page.screenshot({ path: out('1-inspect.png') });
  await page.close();
}

// 2. Spread (Visual) in the gap between two feature cards.
{
  const page = await open();
  await collapse(page);
  const f1 = await box(page, '#f1');
  const x = Math.round(f1.x + f1.width + 10), y = Math.round(f1.y + f1.height / 2);
  await page.mouse.move(x, y);
  await page.keyboard.press('s');
  await page.mouse.move(x, y + 1);
  await page.waitForTimeout(2600); // snapshot + toast fade
  await page.screenshot({ path: out('2-spread.png') });
  await page.close();
}

// 3. Distance: pinned CTA, Alt-hover the product shot.
{
  const page = await open();
  await pin(page, '#cta');
  await collapse(page);
  const s = await box(page, '#shot');
  await page.keyboard.down('Alt');
  await page.mouse.move(s.x + 300, s.y + 300);
  await page.mouse.move(s.x + 301, s.y + 301);
  await page.waitForTimeout(250);
  await page.screenshot({ path: out('3-distance.png') });
  await page.keyboard.up('Alt');
  await page.close();
}

// 4. Light theme, rem units: pinned headline, hovering a feature card.
{
  const page = await open({ theme: 'light', units: 'rem' });
  await pin(page, '#headline', 20, 20);
  const f = await box(page, '#f3');
  await page.mouse.move(f.x + 20, f.y + 20);
  await page.waitForTimeout(250);
  await page.screenshot({ path: out('4-light-rem.png') });
  await page.close();
}

// 5. Copy for AI: the brief + screenshot toast.
{
  const page = await open();
  await pin(page, '#shot', 8, 8);
  await page.locator('lidar-root .panel').getByRole('button', { name: 'Copy for AI' }).click();
  await page.locator('lidar-root .toast.show').waitFor();
  await page.mouse.move(150, 300); // over the panel body: nothing outlined, no tooltip
  await page.waitForTimeout(200);
  await page.screenshot({ path: out('5-copy-for-ai.png') });
  await page.close();
}

// Promo tiles.
const icon = await readFile('static/icons/128.png');
const iconUrl = `data:image/png;base64,${icon.toString('base64')}`;
async function tile(name, w, h, scale) {
  const page = await ctx.newPage();
  await page.setViewportSize({ width: w, height: h });
  await page.setContent(`<!doctype html><html><head><style>
    html,body{margin:0;width:${w}px;height:${h}px;overflow:hidden}
    body{background:#1f1f1f;color:#ececec;font-family:-apple-system,"SF Pro Display","Helvetica Neue",sans-serif;
      display:flex;align-items:center;gap:${28 * scale}px;padding:0 ${44 * scale}px;box-sizing:border-box;position:relative}
    .rul{position:absolute;left:0;right:0;top:0;height:${14 * scale}px;background:#2a2a2a;
      background-image:linear-gradient(90deg,#ffffff55 1px,transparent 1px),linear-gradient(90deg,#ffffff55 1px,transparent 1px);
      background-size:${10 * scale}px ${4 * scale}px,${50 * scale}px ${9 * scale}px;background-repeat:repeat-x;background-position:0 100%,0 100%}
    .line{position:absolute;left:${44 * scale}px;right:${44 * scale}px;bottom:${36 * scale}px;height:2px;background:#ff5a36}
    .line:before,.line:after{content:"";position:absolute;top:-${5 * scale}px;width:2px;height:${12 * scale}px;background:#ff5a36}
    .line:after{right:0}
    img{width:${96 * scale}px;height:${96 * scale}px;border-radius:${22 * scale}px}
    h1{margin:0;font-size:${46 * scale}px;letter-spacing:-.02em;line-height:1}
    p{margin:${10 * scale}px 0 0;font-size:${17 * scale}px;color:#bdbdbd;line-height:1.3}
    b{color:#ff8a6e;font-weight:600}
  </style></head><body><div class="rul"></div><img src="${iconUrl}"><div><h1>Lidar</h1>
    <p>Measure &amp; inspect anything on the web.<br><b>Every feature free.</b></p></div><div class="line"></div></body></html>`);
  await page.screenshot({ path: out(name) });
  await page.close();
}
await tile('promo-small-440x280.png', 440, 280, 0.8);
await tile('promo-marquee-1400x560.png', 1400, 560, 2);

await ctx.close();
console.log('wrote store/out/*.png');
