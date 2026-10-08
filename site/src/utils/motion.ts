export type Rect = { x: number; y: number; w: number; h: number };

export const easeOut = (k: number) => 1 - (1 - k) ** 3;

export const lerpRect = (a: Rect, b: Rect, e: number): Rect => ({
  x: a.x + (b.x - a.x) * e,
  y: a.y + (b.y - a.y) * e,
  w: a.w + (b.w - a.w) * e,
  h: a.h + (b.h - a.h) * e,
});
