import type { Rect } from './geometry';


export interface Seg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Everything the canvas draws in one frame. Plain data, rebuilt by the overlay on each dirty frame. */
export interface Scene {
  /** Column grid. */
  fills: Rect[];
  /** X-ray boxes and search matches. */
  outlines: Rect[];
  /** The current search match. */
  strong: Rect[];
  /** Flex and grid gaps. */
  hatches: Rect[];
  /** Flex/grid containers and flex items. */
  boxes: Rect[];
  /** Grid track edges and flex line breaks. */
  dashes: Seg[];
}

export const emptyScene = (): Scene => ({ fills: [], outlines: [], strong: [], hatches: [], boxes: [], dashes: [] });

const ACC = '#ff5a36';
const LAYOUT = '#a970ff';
const RECT = ['left', 'top', 'width', 'height'];
const SEG = ['x1', 'y1', 'x2', 'y2'];

/** Paints a Scene onto one viewport-sized canvas, so thousands of boxes cost one element and no DOM work. */
export function createPainter(canvas: HTMLCanvasElement): { paint(scene: Scene): void } {
  const ctx = canvas.getContext('2d')!;
  const tile = new OffscreenCanvas(8, 8);
  const t = tile.getContext('2d')!;
  t.strokeStyle = `${LAYOUT}99`;
  t.lineWidth = 2;
  t.beginPath();
  t.moveTo(0, 8); t.lineTo(8, 0);
  t.moveTo(-2, 2); t.lineTo(2, -2);
  t.moveTo(6, 10); t.lineTo(10, 6);
  t.stroke();
  const hatch = ctx.createPattern(tile, 'repeat')!;
  let blank = true;
  let last: Scene | null = null; // what the canvas shows now; null when it was cleared or resized
  const same = (a: Scene, b: Scene) =>
    (Object.keys(a) as (keyof Scene)[]).every(k => {
      const x = a[k] as unknown as Record<string, number>[];
      const y = b[k] as unknown as Record<string, number>[];
      if (x === y) return true;
      if (x.length !== y.length) return false;
      const f = k === 'dashes' ? SEG : RECT;
      return x.every((e, i) => f.every(p => e[p] === y[i][p]));
    });
  const rects = (list: Rect[], inset: number) => {
    ctx.beginPath();
    for (const r of list) ctx.rect(r.left + inset, r.top + inset, r.width - 2 * inset, r.height - 2 * inset);
  };

  return {
    paint(s) {
      const dpr = devicePixelRatio || 1;
      const w = Math.round(innerWidth * dpr);
      const h = Math.round(innerHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w; // resizing also clears it
        canvas.height = h;
        blank = true;
        last = null;
      }
      if (__TEST__) canvas.dataset.scene = JSON.stringify(Object.fromEntries(Object.entries(s).map(([k, v]) => [k, v.length])));
      const empty = Object.values(s).every(l => l.length === 0);
      if (empty && blank) return;
      if (last && same(last, s)) return;
      last = s; // scenes are rebuilt each frame, never mutated after paint
      blank = empty;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, innerWidth, innerHeight);
      ctx.fillStyle = `${ACC}1f`;
      rects(s.fills, 0);
      ctx.fill();
      ctx.fillStyle = hatch;
      rects(s.hatches, 0);
      ctx.fill();
      ctx.lineWidth = 1;
      ctx.strokeStyle = `${ACC}80`;
      rects(s.outlines, 0.5);
      ctx.stroke();
      ctx.strokeStyle = LAYOUT;
      rects(s.boxes, 0.5);
      ctx.stroke();
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      for (const d of s.dashes) {
        ctx.moveTo(d.x1, d.y1);
        ctx.lineTo(d.x2, d.y2);
      }
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = ACC;
      rects(s.strong, 1);
      ctx.stroke();
    },
  };
}
