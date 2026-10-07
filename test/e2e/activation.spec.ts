import { expect, frame, test } from './fixtures';

test('the toolbar toggle opens and closes Lidar', async ({ page, activate }) => {
  await activate();
  await expect(page.locator('lidar-root .dock')).toBeVisible();
  await activate();
  await expect(page.locator('lidar-root')).toHaveCount(0);
  await activate();
  await expect(page.locator('lidar-root')).toHaveCount(1);
});

test('Esc closes Lidar and leaves the page DOM exactly as it was', async ({ page, activate }) => {
  const before = await page.evaluate(() => document.documentElement.outerHTML);
  await activate();
  await page.mouse.move(300, 300);
  await page.keyboard.press('Escape');
  await expect(page.locator('lidar-root')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.outerHTML)).toBe(before);
});

test('Lidar is styled under a strict CSP and ignores hostile page CSS', async ({ page, activate }) => {
  await page.evaluate(() => scrollTo(0, 600));
  await activate();
  const dock = page.locator('lidar-root .dock');
  await expect(dock).toHaveCSS('background-color', 'rgb(27, 25, 23)');
  // The bundled mono face loads from bytes, so the page's CSP can't block it.
  await expect.poll(() => page.evaluate(() => [...document.fonts].filter(f => f.family.includes('Lidar Mono') && f.status === 'loaded').length)).toBe(2);
  expect(await dock.evaluate(el => getComputedStyle(el).fontFamily)).not.toContain('Comic Sans');
  const box = (await dock.boundingBox())!;
  expect(box.y + box.height).toBeGreaterThan(800 - 40);
  expect(box.y + box.height).toBeLessThanOrEqual(800);
});

test('tool keys switch the active tool', async ({ page, activate }) => {
  await activate();
  await page.keyboard.press('d');
  await expect(page.locator('lidar-root [data-tool="distance"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('lidar-root [data-tool="measure"]')).toHaveAttribute('aria-pressed', 'false');
  await page.keyboard.press('m');
  await expect(page.locator('lidar-root [data-tool="measure"]')).toHaveAttribute('aria-pressed', 'true');
});

test('a toast from one session is gone when Lidar reopens', async ({ page, activate }) => {
  await activate();
  await page.keyboard.press('r');
  await expect(page.locator('lidar-root .toast')).toHaveClass(/show/);
  await page.keyboard.press('Escape');
  await expect(page.locator('lidar-root')).toHaveCount(0);
  await activate();
  await expect(page.locator('lidar-root .toast')).not.toHaveClass(/show/);
  await expect(page.locator('lidar-root .toast')).toHaveText(''); // no stale message either
});

test('page fields keep their keystrokes while Lidar is open', async ({ page, activate }) => {
  await page.locator('#q').focus();
  await activate();
  await page.keyboard.type('md');
  await expect(page.locator('#q')).toHaveValue('md');
  await expect(page.locator('lidar-root [data-tool="measure"]')).toHaveAttribute('aria-pressed', 'true');
});

test('tool keys still work after a page field was focused and an element is pinned', async ({ page, activate }) => {
  await page.locator('#q').focus();
  await activate();
  const b = (await page.locator('#c2').boundingBox())!;
  await page.mouse.click(b.x + 5, b.y + 5);
  await page.keyboard.press('d');
  await expect(page.locator('#q')).toHaveValue('');
  await expect(page.locator('lidar-root [data-tool="distance"]')).toHaveAttribute('aria-pressed', 'true');
  await page.keyboard.press('m');
  await expect(page.locator('#q')).toHaveValue('');
  await expect(page.locator('lidar-root [data-tool="measure"]')).toHaveAttribute('aria-pressed', 'true');
});

test('the page keeps no keyup for a key Lidar handled', async ({ page, activate }) => {
  await page.evaluate(() => {
    const w = window as unknown as { ups: string[] };
    w.ups = [];
    document.addEventListener('keyup', e => w.ups.push(e.key));
  });
  await activate();
  await page.keyboard.press('d');
  await page.keyboard.press('x'); // not Lidar's: the page still gets it
  expect(await page.evaluate(() => (window as unknown as { ups: string[] }).ups)).toEqual(['x']);
});

test('if the page removes Lidar, the session ends and the toggle opens a fresh one', async ({ page, activate }) => {
  await activate();
  await page.evaluate(() => document.querySelector('lidar-root')!.remove());
  await frame(page);
  const b = (await page.locator('#c1').boundingBox())!;
  await page.evaluate(() => {
    const w = window as unknown as { clicks: number };
    w.clicks = 0;
    document.addEventListener('mousedown', () => w.clicks++);
  });
  await page.mouse.click(b.x + 5, b.y + 5);
  expect(await page.evaluate(() => (window as unknown as { clicks: number }).clicks)).toBe(1); // page input is back
  await activate();
  await expect(page.locator('lidar-root .dock')).toBeVisible();
});

test('Lidar stays usable above a page popover', async ({ page, activate }) => {
  await activate();
  await page.evaluate(() => {
    const p = document.createElement('div');
    p.id = 'pop';
    p.popover = 'manual';
    p.style.cssText = 'inset:auto 0 0 0;width:100vw;height:200px;margin:0;background:#fff';
    document.body.append(p);
    p.showPopover();
  });
  await page.locator('lidar-root [data-tool="distance"]').click({ timeout: 3000 });
  await expect(page.locator('lidar-root [data-tool="distance"]')).toHaveAttribute('aria-pressed', 'true');
});

test('Lidar works over a modal page dialog', async ({ page, activate }) => {
  const before = await page.evaluate(() => {
    const d = document.createElement('dialog');
    d.id = 'dlg';
    d.innerHTML = '<button id="inside">Inside</button>';
    d.style.cssText = 'width:300px;height:200px;padding:20px';
    document.body.append(d);
    return document.documentElement.outerHTML;
  });
  await activate();
  await page.evaluate(() => (document.getElementById('dlg') as HTMLDialogElement).showModal());
  await page.locator('lidar-root [data-tool="distance"]').click({ timeout: 3000 });
  await expect(page.locator('lidar-root [data-tool="distance"]')).toHaveAttribute('aria-pressed', 'true');
  const b = (await page.locator('#inside').boundingBox())!;
  await page.mouse.move(b.x + 3, b.y + 3);
  await frame(page);
  const hl = (await page.locator('lidar-root [data-ov="hover"]').boundingBox())!;
  expect(Math.abs(hl.x - b.x)).toBeLessThan(1);
  expect(Math.abs(hl.width - b.width)).toBeLessThan(1);
  await page.evaluate(() => (document.getElementById('dlg') as HTMLDialogElement).close());
  await page.keyboard.press('Escape');
  await expect(page.locator('lidar-root')).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.outerHTML)).toBe(before);
});

test('Lidar survives the page removing an open modal dialog', async ({ page, activate }) => {
  await page.evaluate(() => {
    const d = document.createElement('dialog');
    d.id = 'dlg';
    document.body.append(d);
  });
  await activate();
  await page.evaluate(() => (document.getElementById('dlg') as HTMLDialogElement).showModal());
  await frame(page);
  await page.evaluate(() => document.getElementById('dlg')!.remove());
  await frame(page);
  await page.locator('lidar-root [data-tool="distance"]').click({ timeout: 3000 });
  await expect(page.locator('lidar-root [data-tool="distance"]')).toHaveAttribute('aria-pressed', 'true');
});

test('key hints say ⌥ on a Mac and Alt everywhere else', async ({ page, activate }) => {
  await activate();
  const mac = await page.evaluate(() => {
    const n = navigator as Navigator & { userAgentData?: { platform: string } };
    return /mac/i.test(n.userAgentData?.platform ?? n.platform);
  });
  const alt = mac ? '⌥' : 'Alt';
  await expect(page.locator('lidar-root [data-tool="distance"] .tip')).toContainText(`or hold${alt}`);
  await expect(page.locator('lidar-root .panel .empty kbd').first()).toHaveText(alt);
});
