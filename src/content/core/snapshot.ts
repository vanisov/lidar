import { captureVisible } from './screenshot';
import type { Pixels } from './spread';

export interface Snapshot extends Pixels {
  /** Image pixels per CSS pixel. */
  scale: number;
}

/**
 * The page's pixels for Spread's Visual mode. Captured on request once the page has been still for a moment, and
 * dropped whenever it scrolls or resizes. Chrome allows two captures a second, so failures back off.
 */
export function createSnapshotter(hostEl: HTMLElement, onReady: () => void) {
  let snap: Snapshot | null = null;
  let gen = 0; // bumped on invalidate, so a capture that started before a scroll is thrown away
  let pending = false;
  let timer = 0;
  let delay = 150;

  async function take(g: number) {
    pending = true;
    try {
      const img = await captureVisible(hostEl);
      const ctx = new OffscreenCanvas(img.width, img.height).getContext('2d', { willReadFrequently: true })!;
      ctx.drawImage(img, 0, 0);
      const { data, width, height } = ctx.getImageData(0, 0, img.width, img.height);
      if (g !== gen) return;
      snap = { data, width, height, scale: width / innerWidth };
      delay = 150;
      onReady();
    } catch {
      delay = Math.min(delay * 2, 2000);
    } finally {
      pending = false;
    }
  }

  const invalidate = () => {
    gen++;
    snap = null;
    clearTimeout(timer);
    timer = 0;
  };

  return {
    /** The current pixels, or null while a fresh capture is due. */
    get: (): Snapshot | null => snap,
    request() {
      if (snap || pending || timer) return;
      timer = window.setTimeout(() => {
        timer = 0;
        void take(gen);
      }, delay);
    },
    invalidate,
    dispose: invalidate,
  };
}
