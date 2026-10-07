import type { Host } from './host';
import { parentOf } from './inspect';
import { altHeld, flyout, pinned, shiftHeld } from './store';
import { TOOLS } from '../tools/registry';

const SKIP = /^(HEAD|SCRIPT|STYLE|TEMPLATE|META|LINK)$/;
const shown = (e: Element) => !SKIP.test(e.tagName) && e.getClientRects().length > 0;
/** Steps with `next` until it reaches a rendered element, or null. */
const walk = (e: Element | null, next: (e: Element) => Element | null) => {
  while (e && !shown(e)) e = next(e);
  return e;
};

const NAV: Record<string, (e: Element) => Element | null> = {
  ArrowUp: e => {
    const p = parentOf(e);
    return p && p !== document.documentElement ? p : null;
  },
  ArrowDown: e => walk(e.firstElementChild, c => c.nextElementSibling),
  ArrowLeft: e => walk(e.previousElementSibling, c => c.previousElementSibling),
  ArrowRight: e => walk(e.nextElementSibling, c => c.nextElementSibling),
};

export const editable = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));

/** Lidar's keyboard map. Handled keys are swallowed, keydown and keyup, so the page never sees them. */
export function bindKeys(host: Host, close: () => void): () => void {
  const handled = new Set<string>();
  const swallow = (e: KeyboardEvent) => {
    e.preventDefault();
    e.stopImmediatePropagation();
    handled.add(e.code);
  };
  const down = (e: KeyboardEvent) => {
    if (e.key === 'Alt') {
      altHeld.value = true;
      return;
    }
    if (e.key === 'Shift') {
      shiftHeld.value = true;
      return;
    }
    if (e.key === 'Escape') {
      swallow(e);
      if (flyout.value) flyout.value = null; // Esc closes the open flyout first, then Lidar
      else close();
      return;
    }
    if (flyout.value) return; // the open flyout handles its own keys
    if (editable(host.root.activeElement)) return; // typing in Lidar's own inputs
    if (editable(e.target)) return; // the page field keeps its keystrokes
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
    if (e.key === 'Shift') shiftHeld.value = false;
    if (handled.delete(e.code)) {
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };
  const blur = () => {
    altHeld.value = false;
    shiftHeld.value = false;
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
