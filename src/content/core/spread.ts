import type { Rect } from './geometry';

/** Distances from a point to the first edge in each direction. */
export interface Stops {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface Pixels {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

/**
 * Visual edges: walks out from (x, y) in image pixels until a pixel's color differs from the starting pixel by more
 * than `tolerance` in any channel. Runs to the image edge when nothing differs.
 */
export function scanPixels({ data, width, height }: Pixels, x: number, y: number, tolerance: number): Stops {
  const at = (px: number, py: number) => (py * width + px) * 4;
  const o = at(x, y);
  const differs = (px: number, py: number) => {
    const i = at(px, py);
    return (
      Math.abs(data[i] - data[o]) > tolerance ||
      Math.abs(data[i + 1] - data[o + 1]) > tolerance ||
      Math.abs(data[i + 2] - data[o + 2]) > tolerance
    );
  };
  let l = x - 1;
  while (l >= 0 && !differs(l, y)) l--;
  let r = x + 1;
  while (r < width && !differs(r, y)) r++;
  let t = y - 1;
  while (t >= 0 && !differs(x, t)) t--;
  let b = y + 1;
  while (b < height && !differs(x, b)) b++;
  return { left: x - (l + 1), right: r - x, top: y - (t + 1), bottom: b - y };
}

/**
 * Layout edges: the nearest box edge each ray from (x, y) crosses, including the edges of boxes containing the point.
 * Runs to the viewport edge when nothing is in the way.
 */
export function scanBoxes(boxes: Rect[], x: number, y: number, vw: number, vh: number): Stops {
  let left = 0;
  let right = vw;
  let top = 0;
  let bottom = vh;
  for (const b of boxes) {
    if (b.top <= y && y <= b.bottom) {
      for (const e of [b.left, b.right]) {
        if (e < x && e > left) left = e;
        if (e > x && e < right) right = e;
      }
    }
    if (b.left <= x && x <= b.right) {
      for (const e of [b.top, b.bottom]) {
        if (e < y && e > top) top = e;
        if (e > y && e < bottom) bottom = e;
      }
    }
  }
  return { left: x - left, right: right - x, top: y - top, bottom: bottom - y };
}
