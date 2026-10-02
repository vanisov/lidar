export interface Rect {
  left: number;
  top: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}
export type Sides = [top: number, right: number, bottom: number, left: number];
export interface Segment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  length: number;
}
export type Units = 'px' | 'rem';

export function rect(left: number, top: number, width: number, height: number): Rect {
  return { left, top, width, height, right: left + width, bottom: top + height };
}

const contains = (o: Rect, i: Rect) => i.left >= o.left && i.right <= o.right && i.top >= o.top && i.bottom <= o.bottom;

/**
 * Gaps from box `a` (pinned) to box `b` (hovered). Separate boxes give up to one vertical and one horizontal
 * segment; nested boxes give the inner box's distance to each side of the outer one (top, right, bottom, left).
 */
export function distances(a: Rect, b: Rect): Segment[] {
  const seg = (x1: number, y1: number, x2: number, y2: number): Segment => ({
    x1, y1, x2, y2, length: Math.abs(x2 - x1) + Math.abs(y2 - y1),
  });
  if (contains(a, b) || contains(b, a)) {
    const [o, i] = contains(a, b) ? [a, b] : [b, a];
    const cx = i.left + i.width / 2;
    const cy = i.top + i.height / 2;
    return [seg(cx, o.top, cx, i.top), seg(i.right, cy, o.right, cy), seg(cx, i.bottom, cx, o.bottom), seg(o.left, cy, i.left, cy)]
      .filter(s => s.length > 0);
  }
  const overlapX = Math.max(a.left, b.left) < Math.min(a.right, b.right);
  const overlapY = Math.max(a.top, b.top) < Math.min(a.bottom, b.bottom);
  const x = overlapX ? (Math.max(a.left, b.left) + Math.min(a.right, b.right)) / 2 : b.left + b.width / 2;
  const y = overlapY ? (Math.max(a.top, b.top) + Math.min(a.bottom, b.bottom)) / 2 : b.top + b.height / 2;
  const out: Segment[] = [];
  if (b.top >= a.bottom) out.push(seg(x, a.bottom, x, b.top));
  else if (a.top >= b.bottom) out.push(seg(x, b.bottom, x, a.top));
  if (b.left >= a.right) out.push(seg(a.right, y, b.left, y));
  else if (a.left >= b.right) out.push(seg(b.right, y, a.left, y));
  return out;
}

export function formatLength(px: number, units: Units, base: number): string {
  if (units === 'px') return String(Math.round(px));
  return `${Math.round((px / base) * 1000) / 1000}rem`;
}

/** Shortest CSS-shorthand form of four sides, e.g. [13, 22, 13, 22] → "13 22". */
export function compactSides([t, r, b, l]: Sides, fmt: (n: number) => string): string {
  const [T, R, B, L] = [t, r, b, l].map(fmt);
  if (T === R && R === B && B === L) return T;
  if (R === L) return T === B ? `${T} ${R}` : `${T} ${R} ${B}`;
  return `${T} ${R} ${B} ${L}`;
}

/** Where to put a w×h label for `target`: above it, else below it, else inside it, always on screen. */
export function pillPosition(target: Rect, w: number, h: number, vw: number, vh: number, inset = 22, gap = 6) {
  let y = target.top - h - gap;
  if (y < inset) y = target.bottom + gap;
  if (y + h > vh) y = Math.max(target.top, inset) + gap;
  const x = Math.min(Math.max(target.left, inset), vw - w - 4);
  return { x, y };
}

/** Which side the inspector panel should dock to so it doesn't cover `target`. */
export function panelSide(target: Rect, panelWidth: number, vw: number, margin = 18): 'left' | 'right' {
  const underRight = target.right > vw - margin - panelWidth && target.left < vw - margin;
  if (!underRight) return 'right';
  return target.left < margin + panelWidth ? 'right' : 'left';
}
