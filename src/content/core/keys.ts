import type { Host } from './host';
import { altHeld, pinned } from './store';
import { TOOLS } from '../tools/registry';

const NAV: Record<string, (e: Element) => Element | null> = {
  ArrowUp: e => (e.parentElement && e.parentElement !== document.documentElement ? e.parentElement : null),
  ArrowDown: e => e.firstElementChild,
  ArrowLeft: e => e.previousElementSibling,
  ArrowRight: e => e.nextElementSibling,
};

/** Lidar's keyboard map. Handled keys are swallowed so the page never sees them. */
export function bindKeys(host: Host, close: () => void): () => void {
  const swallow = (e: KeyboardEvent) => {
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  const down = (e: KeyboardEvent) => {
    if (e.key === 'Alt') {
      altHeld.value = true;
      return;
    }
    if (e.key === 'Escape') {
      swallow(e);
      close();
      return;
    }
    if (document.activeElement === host.el) return; // typing in Lidar's own inputs
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const go = NAV[e.key];
    const p = pinned.value;
    if (go && p) {
      swallow(e);
      const next = go(p);
      if (next && next !== host.el) pinned.value = next;
      return;
    }
    const t = TOOLS.find(t => t.key === e.key.toLowerCase());
    if (t) {
      swallow(e);
      void t.run();
    }
  };
  const up = (e: KeyboardEvent) => {
    if (e.key === 'Alt') altHeld.value = false;
  };
  const blur = () => {
    altHeld.value = false;
  };
  addEventListener('keydown', down, true);
  addEventListener('keyup', up, true);
  addEventListener('blur', blur);
  return () => {
    removeEventListener('keydown', down, true);
    removeEventListener('keyup', up, true);
    removeEventListener('blur', blur);
  };
}
