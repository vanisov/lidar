import { describe, expect, it } from 'vitest';
import { rect } from '../../src/content/core/geometry';
import { scanBoxes, scanPixels, type Pixels } from '../../src/content/core/spread';

/** A w×h image filled with `bg`, with `fill(x, y)` overriding single pixels. */
function image(w: number, h: number, bg: number[], fill?: (x: number, y: number) => number[] | undefined): Pixels {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) data.set(fill?.(x, y) ?? bg, (y * w + x) * 4);
  return { data, width: w, height: h };
}
const white = [255, 255, 255, 255];
const black = [0, 0, 0, 255];

describe('scanPixels', () => {
  it('runs to the image edges on a plain image', () => {
    expect(scanPixels(image(100, 50, white), 20, 10, 6)).toEqual({ left: 20, right: 80, top: 10, bottom: 40 });
  });
  it('stops at the first pixel that differs', () => {
    // black column at x 70..79, black row at y 40..49
    const img = image(100, 50, white, (x, y) => (x >= 70 && x < 80) || y >= 40 ? black : undefined);
    expect(scanPixels(img, 20, 10, 6)).toEqual({ left: 20, right: 50, top: 10, bottom: 30 });
  });
  it('ignores differences within the tolerance', () => {
    const faint = [250, 250, 250, 255];
    const img = image(100, 50, white, x => (x >= 70 ? faint : undefined));
    expect(scanPixels(img, 20, 10, 6).right).toBe(80);
    expect(scanPixels(img, 20, 10, 4).right).toBe(50);
  });
  it('sees a card only 9 levels lighter than its background', () => {
    const bg = [246, 245, 242, 255];
    const img = image(100, 50, bg, x => (x >= 60 ? white : undefined));
    expect(scanPixels(img, 20, 10, 6).right).toBe(40);
  });
});

describe('scanBoxes', () => {
  // viewport 400×300; container 0..400 × 50..150 holding cards at x 40..140 and 160..260 (y 60..140)
  const boxes = [rect(0, 50, 400, 100), rect(40, 60, 100, 80), rect(160, 60, 100, 80)];
  it('stops at the nearest box edge in each direction', () => {
    expect(scanBoxes(boxes, 150, 100, 400, 300)).toEqual({ left: 10, right: 10, top: 50, bottom: 50 });
  });
  it('counts the edges of the box the point is inside', () => {
    expect(scanBoxes(boxes, 90, 100, 400, 300)).toEqual({ left: 50, right: 50, top: 40, bottom: 40 });
  });
  it('runs to the viewport when nothing is in the way', () => {
    expect(scanBoxes([], 100, 120, 400, 300)).toEqual({ left: 100, right: 300, top: 120, bottom: 180 });
  });
  it('ignores boxes the ray does not cross', () => {
    expect(scanBoxes([rect(200, 0, 50, 20)], 100, 120, 400, 300)).toEqual({ left: 100, right: 300, top: 120, bottom: 180 });
  });
});
