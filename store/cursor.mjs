// Headless Chrome paints no cursor, so one is drawn in Lidar's shadow root (open in the test build): the only place
// that stays above Lidar in the top layer.

function drawCursor() {
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
}

const easeInOut = k => (k < 0.5 ? 4 * k ** 3 : 1 - (-2 * k + 2) ** 3 / 2);

export async function createPointer(page, start = { x: 700, y: 470 }) {
  await page.evaluate(drawCursor);
  let at = start;
  await page.mouse.move(at.x, at.y);
  return {
    async glide(x, y, ms = 700) {
      const from = at, n = Math.max(1, Math.round(ms / 16));
      for (let i = 1; i <= n; i++) {
        const e = easeInOut(i / n);
        await page.mouse.move(from.x + (x - from.x) * e, from.y + (y - from.y) * e);
        await page.waitForTimeout(16);
      }
      at = { x, y };
    },
    async click() {
      await page.mouse.down();
      await page.waitForTimeout(90);
      await page.mouse.up();
    },
  };
}
