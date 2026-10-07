import { expect, frame, test } from './fixtures';

test('hovering across a 5,000-element page causes no long tasks', async ({ page, activate }) => {
  await page.evaluate(() => {
    const box = document.createElement('div');
    for (let i = 0; i < 5000; i++) {
      const s = document.createElement('span');
      s.textContent = `item ${i} `;
      box.append(s);
    }
    document.body.prepend(box);
  });
  await activate();
  await page.evaluate(() => {
    const w = window as unknown as { __long: number };
    w.__long = 0;
    new PerformanceObserver(list => (w.__long += list.getEntries().length)).observe({ type: 'longtask' });
  });
  for (let i = 0; i < 150; i++) await page.mouse.move(40 + ((i * 37) % 1200), 30 + ((i * 23) % 740));
  await frame(page);
  expect(await page.evaluate(() => (window as unknown as { __long: number }).__long)).toBe(0);
});

test('X-ray on a 5,000-element page scrolls and hovers with no long tasks', async ({ page, activate }) => {
  await page.evaluate(() => {
    const box = document.createElement('div');
    for (let i = 0; i < 5000; i++) {
      const s = document.createElement('span');
      s.textContent = `item ${i} `;
      box.append(s);
    }
    document.body.prepend(box);
  });
  await activate();
  await page.keyboard.press('x');
  await expect
    .poll(async () => JSON.parse((await page.locator('lidar-root [data-ov="paint"]').getAttribute('data-scene')) ?? '{}').outlines)
    .toBeGreaterThan(5);
  await page.evaluate(() => {
    const w = window as unknown as { __long: number };
    w.__long = 0;
    new PerformanceObserver(list => (w.__long += list.getEntries().length)).observe({ type: 'longtask' });
  });
  for (let i = 0; i < 60; i++) {
    await page.mouse.move(40 + ((i * 37) % 1200), 30 + ((i * 23) % 740));
    if (i % 6 === 0) await page.mouse.wheel(0, 120);
  }
  await frame(page);
  expect(await page.evaluate(() => (window as unknown as { __long: number }).__long)).toBe(0);
});
