// Renders the Chrome Web Store screenshots (1280×800) and promo tiles from store/demo.html.
// Run with `npm run store` (it builds the test bundle first, which lets this script open Lidar).
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { launch, box, settle } from './session.mjs';

const out = name => path.join('store/out', name);
const { ctx, open } = await launch();

async function pin(page, sel, dx = 8, dy = 8) {
  const b = await box(page, sel);
  await page.mouse.click(b.x + dx, b.y + dy);
  await settle(page);
}
// Every shot keeps the inspector open. It docks on the right because each target sits on the left.
const restOnPanel = page => page.mouse.move(1120, 240);

// 1. Inspect: a pinned KPI card with the full inspector.
{
  const page = await open();
  await pin(page, '#k1');
  await restOnPanel(page);
  await page.waitForTimeout(250);
  await page.screenshot({ path: out('1-inspect.png') });
  await page.close();
}

// 2. Spread (Visual) in the gap between the first two KPI cards.
{
  const page = await open();
  const k1 = await box(page, '#k1');
  const x = Math.round(k1.x + k1.width + 8), y = Math.round(k1.y + k1.height / 2);
  await page.mouse.move(x, y);
  await page.keyboard.press('s');
  await page.mouse.move(x, y + 1);
  await page.waitForTimeout(2600); // snapshot + toast fade
  await page.screenshot({ path: out('2-spread.png') });
  await page.close();
}

// 3. Distance: pinned first KPI card, Alt-hover the chart below it.
{
  const page = await open();
  await pin(page, '#k1');
  const c = await box(page, '#chart');
  await page.keyboard.down('Alt');
  await page.mouse.move(c.x + 200, c.y + 120);
  await page.mouse.move(c.x + 201, c.y + 121);
  await page.waitForTimeout(250);
  await page.screenshot({ path: out('3-distance.png') });
  await page.keyboard.up('Alt');
  await page.close();
}

// 4. Light theme, rem units: pinned page title, hovering a KPI card.
{
  const page = await open({ theme: 'light', units: 'rem' });
  await pin(page, '#headline', 10, 10);
  const k = await box(page, '#k2');
  await page.mouse.move(k.x + 20, k.y + 20);
  await page.waitForTimeout(250);
  await page.screenshot({ path: out('4-light-rem.png') });
  await page.close();
}

// 5. Copy for AI: the brief + screenshot toast for the Top pages card.
{
  const page = await open();
  await pin(page, '#pages', 8, 8);
  await page.locator('lidar-root .panel').getByRole('button', { name: 'Copy for AI' }).click();
  await page.locator('lidar-root .toast.show').waitFor();
  await restOnPanel(page);
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
    body{background:#1b1917;color:#f2efe9;font-family:-apple-system,"SF Pro Display","Helvetica Neue",sans-serif;
      display:flex;align-items:center;gap:${28 * scale}px;padding:0 ${44 * scale}px;box-sizing:border-box;position:relative}
    .rul{position:absolute;left:0;right:0;top:0;height:${14 * scale}px;background:#24211e;
      background-image:linear-gradient(90deg,#f2efe955 1px,transparent 1px),linear-gradient(90deg,#f2efe955 1px,transparent 1px);
      background-size:${10 * scale}px ${4 * scale}px,${50 * scale}px ${9 * scale}px;background-repeat:repeat-x;background-position:0 100%,0 100%}
    .line{position:absolute;left:${44 * scale}px;right:${44 * scale}px;bottom:${36 * scale}px;height:2px;background:#ff5a36}
    .line:before,.line:after{content:"";position:absolute;top:-${5 * scale}px;width:2px;height:${12 * scale}px;background:#ff5a36}
    .line:after{right:0}
    img{width:${96 * scale}px;height:${96 * scale}px;border-radius:${22 * scale}px}
    h1{margin:0;font-size:${46 * scale}px;letter-spacing:-.02em;line-height:1}
    p{margin:${10 * scale}px 0 0;font-size:${17 * scale}px;color:#a8a29a;line-height:1.3}
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
