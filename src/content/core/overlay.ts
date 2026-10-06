import { effect } from '@preact/signals';
import { createBoxCache } from './boxes';
import { distances, formatLength, pillPosition, type Sides } from './geometry';
import type { Host } from './host';
import { editable } from './keys';
import { rulerScale } from './rulers';
import { settings } from './settings';
import { createSnapshotter } from './snapshot';
import { scanBoxes, scanPixels, type Stops } from './spread';
import { altHeld, pinNext, pinned, shiftHeld, tool } from './store';

const DIRS = ['left', 'right', 'top', 'bottom'] as const;

const BLOCKED = ['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'dblclick', 'auxclick'] as const;

const sidesOf = (cs: CSSStyleDeclaration, prop: 'margin' | 'padding'): Sides =>
  (['top', 'right', 'bottom', 'left'] as const).map(s => parseFloat(cs.getPropertyValue(`${prop}-${s}`)) || 0) as Sides;

/**
 * Draws hover, pin, distance and ruler overlays into `layer` and owns page pointer input while Lidar is open.
 * The hot path never touches Preact: one rAF loop updates a fixed pool of nodes. Returns a stop function.
 * Calls `close` if the page removes Lidar's host.
 */
export function startOverlay(host: Host, layer: HTMLElement, close: () => void): () => void {
  const node = (cls: string, name: string) => {
    const d = document.createElement('div');
    d.className = `ov ${cls}`;
    d.dataset.ov = name;
    layer.append(d);
    return d;
  };
  const rulerH = node('rul h', 'ruler-h');
  const rulerV = node('rul v', 'ruler-v');
  // Numbered long ticks; rebuilt only when the viewport or units change.
  const rulerLabels = document.createElement('div');
  layer.append(rulerLabels);
  const posX = node('rpos x', 'ruler-pos-x');
  const posY = node('rpos y', 'ruler-pos-y');
  const crossX = node('cross x', 'cross-x');
  const crossY = node('cross y', 'cross-y');
  const margin = node('mar', 'margin');
  const hover = node('hl', 'hover');
  const pin = node('pin', 'pinned');
  const size = node('pill', 'size');
  const lines = [0, 1, 2, 3].map(i => node('dl', `dist-line-${i}`));
  const labels = [0, 1, 2, 3].map(i => node('pill', `dist-${i}`));
  const spreadLines = DIRS.map(d => node('dl', `spread-line-${d}`));
  const spreadLabels = DIRS.map(d => node('pill', `spread-${d}`));
  const spreadGap = node('pill', 'spread-gap');
  // Events inside a frame never reach this window, so a hovered frame gets a shield that keeps the pointer here.
  const shield = node('shield', 'shield');

  const rulerPair = [rulerH, rulerV];
  const cursorNodes = [posX, posY, crossX, crossY];
  const spreadNodes = [...spreadLines, ...spreadLabels, spreadGap];
  const hoverNodes = [margin, hover, size];

  let mx = -1;
  let my = -1;
  let hovered: Element | null = null;
  let dirty = true;
  let rulersDirty = true;
  let raf = 0;
  const snapshot = createSnapshotter(host.el, () => (dirty = true));
  const boxCache = createBoxCache(host.el);
  let cfg = settings.peek();
  let fmt = (n: number) => formatLength(n, cfg.units, cfg.remBase);

  // Last value written per node and property, so unchanged frames cost no style writes.
  const written = new WeakMap<HTMLElement, Record<string, string>>();
  const set = (el: HTMLElement, prop: string, val: string) => {
    const w = written.get(el) ?? {};
    written.set(el, w);
    if (w[prop] === val) return false;
    w[prop] = val;
    el.style.setProperty(prop, val);
    return true;
  };
  const place = (el: HTMLElement, x: number, y: number, w?: number, h?: number) => {
    set(el, 'display', 'block');
    set(el, 'transform', `translate(${x}px, ${y}px)`);
    if (w !== undefined && h !== undefined) {
      set(el, 'width', `${Math.max(0, w)}px`);
      set(el, 'height', `${Math.max(0, h)}px`);
    }
  };
  const hide = (el: HTMLElement) => {
    set(el, 'display', 'none');
  };
  // Sets text and returns the pill's size. Layout is read only when the text changed.
  const sizes = new WeakMap<HTMLElement, { w: number; h: number }>();
  const label = (el: HTMLElement, text: string) => {
    let sz = sizes.get(el);
    if (!sz || el.textContent !== text) {
      el.textContent = text;
      set(el, 'display', 'block'); // display:none has no size to measure
      sz = { w: el.offsetWidth, h: el.offsetHeight };
      sizes.set(el, sz);
    }
    return sz;
  };
  // The shield stands in for the page element under it, so input on it counts as page input.
  const own = (e: Event) => {
    const path = e.composedPath();
    return path.includes(host.el) && !path.includes(shield);
  };
  // True over Lidar's own dock or panel; the shield stands in for the frame under it.
  const onUi = (x: number, y: number) => {
    const mine = host.root.elementFromPoint(x, y);
    return !!mine && mine !== shield && host.root.contains(mine);
  };
  const pick = (x: number, y: number) => {
    // Pointing at Lidar's own UI measures nothing.
    if (onUi(x, y)) return null;
    let t: Element | null | undefined = document.elementsFromPoint(x, y).find(e => e !== host.el);
    // Descend into open shadow roots (closed ones stay one box), skipping Lidar's host at every level.
    while (t?.shadowRoot) {
      const i: Element | undefined = t.shadowRoot.elementsFromPoint(x, y).find(e => e !== host.el);
      if (!i || i === t) break;
      t = i;
    }
    return !t || t === document.documentElement ? null : t;
  };

  const onMove = (e: PointerEvent) => {
    mx = Math.round(e.clientX);
    my = Math.round(e.clientY);
    altHeld.value = e.altKey;
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
    // The click can land before the next frame has refreshed `hovered`.
    const t = pick(e.clientX, e.clientY);
    if (e.button === 0 && t && tool.value !== 'color') {
      pinned.value = t;
      // Focus left in a page field or on a Lidar button would keep tool and arrow keys from Lidar.
      if (editable(document.activeElement)) (document.activeElement as HTMLElement).blur();
      (host.root.activeElement as HTMLElement | null)?.blur();
    }
  };
  const moved = () => {
    dirty = true;
    snapshot.invalidate();
    boxCache.invalidate();
  };
  const resized = () => {
    moved();
    rulersDirty = true;
  };

  addEventListener('pointermove', onMove, true);
  addEventListener('pointerover', onMove, true); // entering a frame sends only this to the parent
  BLOCKED.forEach(t => addEventListener(t, block, true));
  addEventListener('click', onClick, true);
  addEventListener('scroll', moved, true);
  addEventListener('resize', resized);
  const unwatch = effect(() => {
    // Reading these subscribes the effect; any change forces a redraw.
    void pinned.value;
    void tool.value;
    void altHeld.value;
    void shiftHeld.value;
    const prev = cfg;
    cfg = settings.value;
    if (cfg.units !== prev.units || cfg.remBase !== prev.remBase) rulersDirty = true;
    fmt = (n: number) => formatLength(n, cfg.units, cfg.remBase);
    dirty = true;
  });

  function layoutRulers() {
    const sc = rulerScale(cfg.units, cfg.remBase);
    for (const r of rulerPair) {
      set(r, '--major', `${sc.major}px`);
      set(r, '--mid', `${sc.mid}px`);
      set(r, '--minor', `${sc.minor}px`);
    }
    const tick = (axis: 'x' | 'y', n: number) => {
      const d = document.createElement('div');
      d.className = `ov rlab ${axis}`;
      d.dataset.ov = `ruler-label-${axis}`;
      d.textContent = sc.label(n);
      d.style.display = 'block';
      d.style.transform = axis === 'x' ? `translate(${n * sc.major + 3}px, 3px)` : `translate(3px, ${n * sc.major + 3}px) rotate(180deg)`;
      return d;
    };
    const ticks: HTMLElement[] = [];
    for (let n = 1; n * sc.major < innerWidth; n++) ticks.push(tick('x', n));
    for (let n = 1; n * sc.major < innerHeight; n++) ticks.push(tick('y', n));
    rulerLabels.replaceChildren(...ticks);
    rulersDirty = false;
  }

  function draw() {
    const vw = innerWidth;
    const vh = innerHeight;

    // Read phase: every layout/style read happens here, before any write.
    hovered = mx >= 0 ? pick(mx, my) : null;
    if (pinNext.peek() && hovered) {
      pinned.value = hovered;
      pinNext.value = false;
    }
    const t = tool.peek();
    const spreading = mx >= 0 && (t === 'spread' || (t === 'measure' && shiftHeld.peek())) && !onUi(mx, my);
    let stops: Stops | null = null;
    if (spreading && cfg.spreadMode === 'layout') stops = scanBoxes(boxCache.get(), mx, my, vw, vh);
    else if (spreading) {
      const px = snapshot.get();
      if (!px) snapshot.request();
      else {
        const s = px.scale;
        const found = scanPixels(px, Math.min(px.width - 1, Math.round(mx * s)), Math.min(px.height - 1, Math.round(my * s)), cfg.spreadTolerance);
        stops = { left: found.left / s, right: found.right / s, top: found.top / s, bottom: found.bottom / s };
      }
    }
    const p = pinned.peek();
    const h = t === 'color' || spreading ? null : hovered;
    const measuring = !!(p && h && h !== p && (altHeld.peek() || tool.peek() === 'distance'));
    const hr = h?.getBoundingClientRect();
    const hcs = h ? getComputedStyle(h) : null;
    const hm = hcs && sidesOf(hcs, 'margin');
    const hp = hcs && sidesOf(hcs, 'padding');
    const hRadius = hcs?.borderRadius;
    const pr = p?.getBoundingClientRect();
    const pRadius = p && getComputedStyle(p).borderRadius;
    const segs = measuring ? distances(pr!, hr!) : null;

    // Write phase.
    if (rulersDirty) layoutRulers();
    for (const r of rulerPair) cfg.rulers ? place(r, 0, 0) : hide(r);
    set(rulerLabels, 'display', cfg.rulers ? 'block' : 'none');
    if (cfg.rulers && mx >= 0) {
      const a = label(posX, fmt(mx));
      place(posX, Math.min(Math.max(mx - a.w / 2, 18), vw - a.w), 1);
      const b = label(posY, fmt(my));
      set(posY, 'transform', `translate(1px, ${Math.min(Math.max(my - b.h / 2, 18), vh - b.h)}px) rotate(180deg)`);
      if (stops) [crossX, crossY].forEach(hide);
      else {
        place(crossX, mx, 18);
        place(crossY, 18, my);
      }
    } else cursorNodes.forEach(hide);

    if (stops) {
      const st = stops;
      const len = DIRS.map(d => st[d]);
      const line = [
        [mx - st.left, my - 0.75, st.left, 1.5],
        [mx, my - 0.75, st.right, 1.5],
        [mx - 0.75, my - st.top, 1.5, st.top],
        [mx - 0.75, my, 1.5, st.bottom],
      ] as const;
      DIRS.forEach((_, i) => {
        if (len[i] < 1) {
          hide(spreadLines[i]);
          hide(spreadLabels[i]);
          return;
        }
        place(spreadLines[i], line[i][0], line[i][1], line[i][2], line[i][3]);
        const sz = label(spreadLabels[i], fmt(len[i]));
        // Centered on its line when it fits, otherwise just past the line's far end so short gaps stay readable.
        const sign = i % 2 === 0 ? -1 : 1;
        let cx: number;
        let cy: number;
        if (i < 2) {
          cx = sz.w + 8 <= len[i] ? mx + (sign * len[i]) / 2 - sz.w / 2 : sign < 0 ? mx - len[i] - sz.w - 4 : mx + len[i] + 4;
          cy = my + 6;
        } else {
          cx = mx + 6;
          cy = sz.h + 8 <= len[i] ? my + (sign * len[i]) / 2 - sz.h / 2 : sign < 0 ? my - len[i] - sz.h - 4 : my + len[i] + 4;
        }
        place(spreadLabels[i], cx, cy);
      });
      // The gap's size sits above the line, past its right end, clear of the per-side labels.
      const g = label(spreadGap, `${fmt(st.left + st.right)} × ${fmt(st.top + st.bottom)}`);
      place(spreadGap, Math.min(mx + st.right + 6, vw - g.w - 4), Math.max(my - g.h - 6, 22));
    } else spreadNodes.forEach(hide);

    if (hr && hm && hp) {
      if (measuring) hide(margin);
      else place(margin, hr.left - hm[3], hr.top - hm[0], hr.width + hm[1] + hm[3], hr.height + hm[0] + hm[2]);
      place(hover, hr.left, hr.top, hr.width, hr.height);
      set(hover, 'border-width', hp.map(v => `${v}px`).join(' '));
      set(hover, 'border-radius', hRadius!);
      const sz = label(size, `${fmt(hr.width)} × ${fmt(hr.height)}`);
      const at = pillPosition(hr, sz.w, sz.h, vw, vh);
      place(size, at.x, at.y);
    } else hoverNodes.forEach(hide);

    if (pr) {
      place(pin, pr.left, pr.top, pr.width, pr.height);
      set(pin, 'border-radius', pRadius!);
    } else hide(pin);

    if (hr && h && /^(IFRAME|EMBED|OBJECT)$/.test(h.tagName)) place(shield, hr.left, hr.top, hr.width, hr.height);
    else hide(shield);

    lines.forEach(hide);
    labels.forEach(hide);
    segs?.forEach((s, i) => {
      const vertical = s.x1 === s.x2;
      place(lines[i], Math.min(s.x1, s.x2) - (vertical ? 0.75 : 0), Math.min(s.y1, s.y2) - (vertical ? 0 : 0.75),
        vertical ? 1.5 : s.length, vertical ? s.length : 1.5);
      label(labels[i], fmt(s.length));
      place(labels[i], vertical ? s.x1 + 6 : (s.x1 + s.x2) / 2 - 12, vertical ? (s.y1 + s.y2) / 2 - 9 : s.y1 + 6);
    });
  }

  const frame = () => {
    if (!host.el.isConnected) return close(); // the page removed Lidar
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
    removeEventListener('pointerover', onMove, true);
    BLOCKED.forEach(t => removeEventListener(t, block, true));
    removeEventListener('click', onClick, true);
    removeEventListener('scroll', moved, true);
    removeEventListener('resize', resized);
    snapshot.dispose();
    boxCache.dispose();
    layer.replaceChildren();
  };
}
