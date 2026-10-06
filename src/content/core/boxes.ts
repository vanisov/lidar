import type { Rect } from './geometry';

/**
 * Boxes of the visible page elements for Spread's Layout mode. Rebuilt lazily after the page scrolls, resizes or
 * changes, and at most every 250ms while the page keeps changing.
 */
export function createBoxCache(hostEl: HTMLElement) {
  let boxes: Rect[] = [];
  let builtAt = -Infinity;
  let stale = true;
  let observer: MutationObserver | null = null;

  const build = () => {
    const vw = innerWidth;
    const vh = innerHeight;
    const out: Rect[] = [];
    if (document.body) out.push(document.body.getBoundingClientRect());
    for (const el of document.body?.getElementsByTagName('*') ?? []) {
      if (el === hostEl) continue;
      const r = el.getBoundingClientRect();
      if ((r.width === 0 && r.height === 0) || r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh) continue;
      out.push(r);
    }
    return out;
  };

  return {
    get(): Rect[] {
      if (!observer) {
        observer = new MutationObserver(() => (stale = true));
        observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
      }
      const now = performance.now();
      if (stale && now - builtAt >= 250) {
        boxes = build();
        builtAt = now;
        stale = false;
      }
      return boxes;
    },
    /** Positions moved (scroll, resize): rebuild on the next read. */
    invalidate() {
      stale = true;
      builtAt = -Infinity;
    },
    dispose() {
      observer?.disconnect();
      boxes = [];
    },
  };
}
