// Records the website's demo video (store/out/demo.mp4): Lidar driven through hover, pin, distance, Spread and
// Copy for AI on store/demo.html. Run with `npm run demo` (needs ffmpeg on PATH).
import { createPointer } from './cursor.mjs';
import { startScreencast } from './screencast.mjs';
import { launch, box } from './session.mjs';

const { ctx, open } = await launch({ deviceScaleFactor: 2 });
const page = await open();
const { glide, click } = await createPointer(page);
const wait = ms => page.waitForTimeout(ms);
const mid = b => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });
const [k1, k2, chart, pages] = await Promise.all(['#k1', '#k2', '#chart', '#pages'].map(sel => box(page, sel)));

const cast = await startScreencast(ctx, page);
await wait(700);

// Hover: sizes appear as the cursor moves over the cards.
await glide(mid(k1).x, mid(k1).y, 900); await wait(900);
await glide(mid(k2).x, mid(k2).y, 650); await wait(800);
// Pin the first card (its padding, so the card itself pins): the inspector fills in.
await glide(k1.x + 10, k1.y + 10, 650); await click(); await wait(1600);
// Hold Alt for distances: to the chart, then to the next card.
await page.keyboard.down('Alt');
await glide(chart.x + 260, chart.y + 140, 850); await wait(1400);
await glide(mid(k2).x, mid(k2).y + 10, 750); await wait(1400);
await page.keyboard.up('Alt');
// Spread in the gap between the cards, then back to measuring.
await glide(k1.x + k1.width + 8, mid(k1).y, 700);
await page.keyboard.press('s');
await glide(k1.x + k1.width + 8, mid(k1).y + 2, 120); await wait(2300);
await page.keyboard.press('m');
// Pin the Top pages card and copy it for AI.
await glide(pages.x + 10, pages.y + 10, 900); await click(); await wait(1000);
const ai = await page.locator('lidar-root .panel').getByRole('button', { name: 'Copy for AI' }).boundingBox();
await glide(mid(ai).x, mid(ai).y, 900); await wait(250); await click(); await wait(2400);

const frames = await cast.stop('store/out/demo.mp4');
await ctx.close();
console.log(`wrote store/out/demo.mp4 from ${frames} frames`);
