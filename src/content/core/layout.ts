import { rect, type Rect } from './geometry';
import type { Seg } from './paint';
import type { Columns } from './settings';

export interface Span {
  start: number;
  end: number;
}
/** A grid line number, centered on (x, y). */
export interface Mark {
  text: string;
  x: number;
  y: number;
  axis: 'col' | 'row';
}

/** Computed grid-template-* resolves to px track sizes ("[a] 100px 200px"); anything else (none, subgrid) is null. */
export function parseTracks(value: string): number[] | null {
  const tokens = value.replace(/\[[^\]]*\]/g, ' ').trim().split(/\s+/).filter(Boolean);
  if (!tokens.length || tokens.some(t => !/^-?[\d.]+px$/.test(t))) return null;
  return tokens.map(parseFloat);
}

/** Where each track sits along one axis, after justify-/align-content shifts the whole set. */
export function trackSpans(origin: number, available: number, sizes: number[], gap: number, align: string): Span[] {
  const free = Math.max(0, available - sizes.reduce((a, b) => a + b, 0) - gap * (sizes.length - 1));
  // ponytail: space-between/around/evenly are drawn as start; distribute the free space if grids use them.
  let at = origin + (/center/.test(align) ? free / 2 : /end|right/.test(align) ? free : 0);
  return sizes.map(s => {
    const span = { start: at, end: at + s };
    at += s + gap;
    return span;
  });
}

/** Line i sits at the outer edge for the first and last line, and mid-gap for the ones between tracks. */
const lineAt = (s: Span[], i: number) =>
  i === 0 ? s[0].start : i === s.length ? s[s.length - 1].end : (s[i - 1].end + s[i].start) / 2;

export function gridDrawing(cols: Span[], rows: Span[]): { hatches: Rect[]; dashes: Seg[]; marks: Mark[] } {
  const top = rows[0].start;
  const bottom = rows[rows.length - 1].end;
  const left = cols[0].start;
  const right = cols[cols.length - 1].end;
  const hatches: Rect[] = [];
  const dashes: Seg[] = [];
  const marks: Mark[] = [];
  cols.forEach((c, i) => {
    dashes.push({ x1: c.start, y1: top, x2: c.start, y2: bottom }, { x1: c.end, y1: top, x2: c.end, y2: bottom });
    if (i && c.start > cols[i - 1].end) hatches.push(rect(cols[i - 1].end, top, c.start - cols[i - 1].end, bottom - top));
  });
  rows.forEach((r, i) => {
    dashes.push({ x1: left, y1: r.start, x2: right, y2: r.start }, { x1: left, y1: r.end, x2: right, y2: r.end });
    if (i && r.start > rows[i - 1].end) hatches.push(rect(left, rows[i - 1].end, right - left, r.start - rows[i - 1].end));
  });
  for (let i = 0; i <= cols.length; i++) marks.push({ text: String(i + 1), x: lineAt(cols, i), y: top, axis: 'col' });
  for (let i = 0; i <= rows.length; i++) marks.push({ text: String(i + 1), x: left, y: lineAt(rows, i), axis: 'row' });
  return { hatches, dashes, marks };
}

/** Gaps between flex items on each line, and a dashed break between wrapped lines. `row` is the main axis. */
export function flexDrawing(box: Rect, items: Rect[], row: boolean): { hatches: Rect[]; dashes: Seg[] } {
  const ms = (r: Rect) => (row ? r.left : r.top);
  const me = (r: Rect) => (row ? r.right : r.bottom);
  const cs = (r: Rect) => (row ? r.top : r.left);
  const ce = (r: Rect) => (row ? r.bottom : r.right);
  // Items whose cross-axis ranges overlap share a flex line.
  const lines: Rect[][] = [];
  for (const it of items) {
    const line = lines[lines.length - 1];
    if (line?.some(o => (cs(it) < ce(o) && ce(it) > cs(o)) || cs(it) === cs(o))) line.push(it);
    else lines.push([it]);
  }
  const extent = lines.map(l => ({ start: Math.min(...l.map(cs)), end: Math.max(...l.map(ce)) }));
  const hatches: Rect[] = [];
  lines.forEach((l, i) => {
    const { start, end } = extent[i];
    const sorted = [...l].sort((a, b) => ms(a) - ms(b));
    for (let k = 1; k < sorted.length; k++) {
      const a = me(sorted[k - 1]);
      const b = ms(sorted[k]);
      if (b - a > 0.5) hatches.push(row ? rect(a, start, b - a, end - start) : rect(start, a, end - start, b - a));
    }
  });
  const order = [...extent].sort((a, b) => a.start - b.start);
  const dashes = order.slice(1).map((e, i) => {
    const mid = (order[i].end + e.start) / 2;
    return row ? { x1: box.left, y1: mid, x2: box.right, y2: mid } : { x1: mid, y1: box.top, x2: mid, y2: box.bottom };
  });
  return { hatches, dashes };
}

/** The column grid: `count` columns across the viewport minus side margins, capped at `maxWidth` and centered. */
export function columnRects(vw: number, vh: number, c: Columns): Rect[] {
  const width = Math.min(vw - 2 * c.margin, c.maxWidth || Infinity);
  const w = (width - c.gutter * (c.count - 1)) / c.count;
  if (w <= 0) return [];
  const left = (vw - width) / 2;
  return Array.from({ length: c.count }, (_, i) => rect(left + i * (w + c.gutter), 0, w, vh));
}

export interface LayoutDrawing {
  hatches: Rect[];
  dashes: Seg[];
  boxes: Rect[];
  marks: Mark[];
}

/** The flex or grid drawing for `el`, or null if it isn't a container. Reads layout: call it in the read phase. */
export function readLayout(el: Element, cs: CSSStyleDeclaration): LayoutDrawing | null {
  const grid = /grid/.test(cs.display);
  if (!grid && !/flex/.test(cs.display)) return null;
  const r = el.getBoundingClientRect();
  const px = (p: string) => parseFloat(cs.getPropertyValue(p)) || 0;
  const l = px('border-left-width') + px('padding-left');
  const t = px('border-top-width') + px('padding-top');
  const box = rect(r.left + l, r.top + t,
    r.width - l - px('border-right-width') - px('padding-right'),
    r.height - t - px('border-bottom-width') - px('padding-bottom'));
  if (grid) {
    const c = parseTracks(cs.gridTemplateColumns);
    const rw = parseTracks(cs.gridTemplateRows);
    if (!c || !rw) return { hatches: [], dashes: [], boxes: [r], marks: [] }; // e.g. subgrid: outline only
    const cols = trackSpans(box.left, box.width, c, px('column-gap'), cs.justifyContent);
    const rows = trackSpans(box.top, box.height, rw, px('row-gap'), cs.alignContent);
    return { ...gridDrawing(cols, rows), boxes: [r] };
  }
  const items: Rect[] = [];
  for (const k of el.children) {
    const kcs = getComputedStyle(k);
    if (kcs.display === 'none' || kcs.display === 'contents' || /absolute|fixed/.test(kcs.position)) continue;
    items.push(k.getBoundingClientRect());
  }
  return { ...flexDrawing(box, items, !/column/.test(cs.flexDirection)), boxes: [r, ...items], marks: [] };
}
