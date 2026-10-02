import { effect } from '@preact/signals';
import { distances, formatLength, pillPosition, type Sides } from './geometry';
import type { Host } from './host';
import { settings } from './settings';
import { altHeld, pinNext, pinned, tool } from './store';

const BLOCKED = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'dblclick', 'auxclick'] as const;

const sidesOf = (cs: CSSStyleDeclaration, prop: 'margin' | 'padding'): Sides =>
  (['top', 'right', 'bottom', 'left'] as const).map(s => parseFloat(cs.getPropertyValue(`${prop}-${s}`)) || 0) as Sides;

/**
 * Draws hover, pin, distance and ruler overlays into `layer` and owns page pointer input while Lidar is open.
 * The hot path never touches Preact: one rAF loop updates a fixed pool of nodes. Returns a stop function.
 */
export function startOverlay(host: Host, layer: HTMLElement): () => void {
  const node = (cls: string, name: string) => {
    const d = document.createElement('div');
    d.className = `ov ${cls}`;
    d.dataset.ov = name;
    layer.append(d);
    return d;
  };
  const rulerH = node('rul h', 'ruler-h');
  const rulerV = node('rul v', 'ruler-v');
  const markX = node('mark x', 'mark-x');
  const markY = node('mark y', 'mark-y');
  const crossX = node('cross x', 'cross-x');
  const crossY = node('cross y', 'cross-y');
  const margin = node('mar', 'margin');
  const hover = node('hl', 'hover');
  const pin = node('pin', 'pinned');
  const size = node('pill', 'size');
  const lines = [0, 1, 2, 3].map(i => node('dl', `dist-line-${i}`));
  const labels = [0, 1, 2, 3].map(i => node('pill', `dist-${i}`));
  const coord = node('coord', 'coord');

  let mx = -1;
  let my = -1;
  let hovered: Element | null = null;
  let dirty = true;
  let raf = 0;

  const place = (el: HTMLElement, x: number, y: number, w?: number, h?: number) => {
    el.style.display = 'block';
    el.style.transform = `translate(${x}px, ${y}px)`;
    if (w !== undefined && h !== undefined) {
      el.style.width = `${Math.max(0, w)}px`;
      el.style.height = `${Math.max(0, h)}px`;
    }
  };
  const hide = (el: HTMLElement) => {
    el.style.display = 'none';
  };
  const own = (e: Event) => e.composedPath().includes(host.el);

  const onMove = (e: PointerEvent) => {
    mx = Math.round(e.clientX);
    my = Math.round(e.clientY);
    altHeld.value = e.altKey;
    const t = document.elementFromPoint(mx, my);
    hovered = !t || t === host.el || t === document.documentElement ? null : t;
    if (pinNext.value && hovered) {
      pinned.value = hovered;
      pinNext.value = false;
    }
    dirty = true;
  };
  const block = (e: Event) => {
    if (own(e)) return;
    e.preventDefault();
    e.stopImmediatePropagation();
  };
  const onClick = (e: MouseEvent) => {
    if (own(e)) return;
    block(e);
    if (e.button === 0 && hovered && tool.value !== 'color') pinned.value = hovered;
  };
  const markDirty = () => {
    dirty = true;
  };

  addEventListener('pointermove', onMove, true);
  BLOCKED.forEach(t => addEventListener(t, block, true));
  addEventListener('click', onClick, true);
  addEventListener('scroll', markDirty, true);
  addEventListener('resize', markDirty);
  const unwatch = effect(() => {
    // Reading these subscribes the effect; any change forces a redraw.
    void pinned.value;
    void tool.value;
    void altHeld.value;
    void settings.value;
    dirty = true;
  });

  function draw() {
    const { units, remBase, rulers } = settings.peek();
    const fmt = (n: number) => formatLength(n, units, remBase);
    const vw = innerWidth;
    const vh = innerHeight;

    for (const r of [rulerH, rulerV]) rulers ? place(r, 0, 0) : hide(r);
    if (rulers && mx >= 0) {
      place(markX, mx, 0);
      place(crossX, mx, 18);
      place(markY, 0, my);
      place(crossY, 18, my);
      coord.textContent = `${fmt(mx)}, ${fmt(my)}`;
      place(coord, Math.min(mx + 14, vw - coord.offsetWidth - 4), Math.min(my + 14, vh - 24));
    } else [markX, markY, crossX, crossY, coord].forEach(hide);

    const p = pinned.peek();
    const h = tool.peek() === 'color' ? null : hovered;
    const measuring = !!(p && h && h !== p && (altHeld.peek() || tool.peek() === 'distance'));

    if (h) {
      const r = h.getBoundingClientRect();
      const cs = getComputedStyle(h);
      const m = sidesOf(cs, 'margin');
      if (measuring) hide(margin);
      else place(margin, r.left - m[3], r.top - m[0], r.width + m[1] + m[3], r.height + m[0] + m[2]);
      place(hover, r.left, r.top, r.width, r.height);
      hover.style.borderWidth = sidesOf(cs, 'padding').map(v => `${v}px`).join(' ');
      hover.style.borderRadius = cs.borderRadius;
      size.textContent = `${fmt(r.width)} × ${fmt(r.height)}`;
      size.style.display = 'block';
      const at = pillPosition(r, size.offsetWidth, size.offsetHeight, vw, vh);
      place(size, at.x, at.y);
    } else [margin, hover, size].forEach(hide);

    if (p) {
      const r = p.getBoundingClientRect();
      place(pin, r.left, r.top, r.width, r.height);
      pin.style.borderRadius = getComputedStyle(p).borderRadius;
    } else hide(pin);

    lines.forEach(hide);
    labels.forEach(hide);
    if (measuring) {
      distances(p!.getBoundingClientRect(), h!.getBoundingClientRect()).forEach((s, i) => {
        const vertical = s.x1 === s.x2;
        place(lines[i], Math.min(s.x1, s.x2) - (vertical ? 0.75 : 0), Math.min(s.y1, s.y2) - (vertical ? 0 : 0.75),
          vertical ? 1.5 : s.length, vertical ? s.length : 1.5);
        labels[i].textContent = fmt(s.length);
        place(labels[i], vertical ? s.x1 + 6 : (s.x1 + s.x2) / 2 - 12, vertical ? (s.y1 + s.y2) / 2 - 9 : s.y1 + 6);
      });
    }
  }

  const frame = () => {
    raf = requestAnimationFrame(frame);
    const p = pinned.peek();
    if (p && !p.isConnected) pinned.value = null; // the page removed it (SPA navigation, re-render)
    if (hovered && !hovered.isConnected) hovered = null;
    // While something is outlined, redraw every frame so overlays follow animations and layout changes.
    if (dirty || hovered || pinned.peek()) {
      dirty = false;
      draw();
    }
  };
  raf = requestAnimationFrame(frame);

  return () => {
    cancelAnimationFrame(raf);
    unwatch();
    removeEventListener('pointermove', onMove, true);
    BLOCKED.forEach(t => removeEventListener(t, block, true));
    removeEventListener('click', onClick, true);
    removeEventListener('scroll', markDirty, true);
    removeEventListener('resize', markDirty);
    layer.replaceChildren();
  };
}
