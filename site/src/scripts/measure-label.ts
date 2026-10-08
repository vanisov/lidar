import { easeOut, lerpRect, type Rect } from '../utils/motion';

const GLIDE_MS = 240;

/** Leaving hides the box after a beat, so crossing a gap between buttons doesn't blink. */
export function startMeasureLabel(box: HTMLElement) {
  const label = box.firstElementChild!;
  let cur: Rect | null = null, target: Element | null = null, raf = 0, hideTimer = 0;

  const draw = (r: Rect) => {
    Object.assign(box.style, { transform: `translate(${r.x}px, ${r.y}px)`, width: `${r.w}px`, height: `${r.h}px` });
    label.textContent = `${Math.round(r.w)} × ${Math.round(r.h)}`;
    box.classList.toggle('below', r.y < 32);
  };
  const moveTo = (to: Rect) => {
    clearTimeout(hideTimer);
    cancelAnimationFrame(raf);
    if (!cur || !box.classList.contains('on')) {
      draw((cur = to));
      box.classList.add('on');
      return;
    }
    const from = cur, start = performance.now();
    const step = (now: number) => {
      const k = Math.min(1, (now - start) / GLIDE_MS);
      draw((cur = lerpRect(from, to, easeOut(k))));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
  };
  const hide = (delay: number) => {
    target = null;
    clearTimeout(hideTimer);
    hideTimer = window.setTimeout(() => box.classList.remove('on'), delay);
  };

  document.addEventListener('pointerover', (e) => {
    const el = (e.target as Element).closest<HTMLElement>('[data-measure]');
    if (!el) return hide(150);
    if (el === target) return;
    target = el;
    const r = el.getBoundingClientRect();
    box.classList.toggle('pill-only', el.dataset.measure === 'pill');
    moveTo({ x: r.left, y: r.top, w: el.offsetWidth, h: el.offsetHeight });
  });
  addEventListener('scroll', () => hide(0), { passive: true });
}
