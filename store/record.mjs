// Records the website's demo video (store/out/demo.mp4): Lidar driven through hover, pin, distance, Spread and
// Copy for AI on store/demo.html. Run with `npm run demo` (needs ffmpeg on PATH).
// Frames come from Chrome's screencast at 2x, timestamped, then ffmpeg holds each one for its real duration.
import { execFileSync } from 'node:child_process';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { launch, box } from './session.mjs';

const { ctx, open } = await launch({ deviceScaleFactor: 2 });
const page = await open();
const frames = await mkdtemp(path.join(tmpdir(), 'lidar-demo-'));

// Headless Chrome draws no cursor, so draw one. It lives in Lidar's (test-build, open) shadow root, the only
// place that stays above Lidar in the top layer.
await page.evaluate(() => {
  const c = document.createElement('div');
  c.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;pointer-events:none;will-change:transform';
  c.innerHTML = `<span style="position:absolute;left:-14px;top:-14px;width:28px;height:28px;border-radius:50%;
    background:#ff5a3640;transform:scale(0);opacity:0;transition:transform .35s,opacity .35s"></span>
    <svg width="22" height="22" viewBox="0 0 22 22" style="position:absolute;left:-3px;top:-2px;filter:drop-shadow(0 1px 1.5px #0006)">
    <path d="M4 2.5v15.2l3.9-3.7 2.6 6 2.7-1.2-2.6-5.9h5.4z" fill="#111" stroke="#fff" stroke-width="1.5" stroke-linejoin="round"/></svg>`;
  document.querySelector('lidar-root').shadowRoot.append(c);
  const ring = c.firstElementChild;
  addEventListener('mousemove', e => { c.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; }, true);
  addEventListener('mousedown', () => {
    ring.style.transition = 'none';
    ring.style.transform = 'scale(.4)';
    ring.style.opacity = '1';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      ring.style.transition = 'transform .35s, opacity .35s';
      ring.style.transform = 'scale(1.6)';
      ring.style.opacity = '0';
    }));
  }, true);
});

let at = { x: 700, y: 470 };
await page.mouse.move(at.x, at.y);
// Moves the mouse along an eased path in real time, so the cursor glides instead of jumping.
async function glide(x, y, ms = 700) {
  const from = at, n = Math.max(1, Math.round(ms / 16));
  for (let i = 1; i <= n; i++) {
    const k = i / n, e = k < .5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2;
    await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e);
    await page.waitForTimeout(16);
  }
  at = { x, y };
}
const click = async () => { await page.mouse.down(); await page.waitForTimeout(90); await page.mouse.up(); };
const wait = ms => page.waitForTimeout(ms);

const cdp = await ctx.newCDPSession(page);
const shots = [];
cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
  const file = path.join(frames, `${String(shots.length).padStart(5, '0')}.jpg`);
  shots.push({ file, t: metadata.timestamp });
  await writeFile(file, Buffer.from(data, 'base64'));
  await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
});
await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 92, everyNthFrame: 1 });
await wait(700);

const k1 = await box(page, '#k1'), k2 = await box(page, '#k2'), chart = await box(page, '#chart'), pages = await box(page, '#pages');
const mid = b => ({ x: b.x + b.width / 2, y: b.y + b.height / 2 });

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
// Spread in the gap between the cards.
await glide(k1.x + k1.width + 8, mid(k1).y, 700);
await page.keyboard.press('s');
await glide(k1.x + k1.width + 8, mid(k1).y + 2, 120); await wait(2300);
await page.keyboard.press('m');
// Pin the Top pages card and copy it for AI.
await glide(pages.x + 10, pages.y + 10, 900); await click(); await wait(1000);
const ai = await page.locator('lidar-root .panel').getByRole('button', { name: 'Copy for AI' }).boundingBox();
await glide(ai.x + ai.width / 2, ai.y + ai.height / 2, 900); await wait(250); await click(); await wait(2400);

await cdp.send('Page.stopScreencast');
await wait(300);
await ctx.close();

// Each frame lasts until the next one arrived; the last one holds for a beat before the loop restarts.
const list = shots.map((s, i) => `file '${s.file}'\nduration ${((shots[i + 1]?.t ?? s.t + 0.6) - s.t).toFixed(4)}`).join('\n');
await writeFile(path.join(frames, 'list.txt'), `ffconcat version 1.0\n${list}\nfile '${shots.at(-1).file}'\n`);
execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', path.join(frames, 'list.txt'),
  '-vf', 'fps=30,scale=1920:-2:flags=lanczos,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-crf', '24',
  '-movflags', '+faststart', '-an', 'store/out/demo.mp4']);
await rm(frames, { recursive: true });
console.log(`wrote store/out/demo.mp4 from ${shots.length} frames`);
