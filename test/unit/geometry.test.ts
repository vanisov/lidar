import { describe, expect, it } from 'vitest';
import { compactSides, distances, formatLength, panelSide, pillPosition, rect } from '../../src/content/core/geometry';

describe('distances', () => {
  it('measures the vertical gap between stacked boxes', () => {
    expect(distances(rect(0, 0, 100, 40), rect(20, 90, 100, 40))).toEqual([{ x1: 60, y1: 40, x2: 60, y2: 90, length: 50 }]);
  });
  it('measures the horizontal gap between side-by-side boxes', () => {
    expect(distances(rect(0, 0, 50, 50), rect(80, 10, 50, 20))).toEqual([{ x1: 50, y1: 20, x2: 80, y2: 20, length: 30 }]);
  });
  it('gives both gaps for diagonal boxes, drawn through the hovered box centre', () => {
    expect(distances(rect(0, 0, 50, 50), rect(100, 100, 20, 20))).toEqual([
      { x1: 110, y1: 50, x2: 110, y2: 100, length: 50 },
      { x1: 50, y1: 110, x2: 100, y2: 110, length: 50 },
    ]);
  });
  it('measures a nested box to all four sides of its container (top, right, bottom, left)', () => {
    expect(distances(rect(0, 0, 200, 100), rect(20, 10, 100, 50)).map(s => s.length)).toEqual([10, 80, 40, 20]);
  });
  it('works whichever of the two boxes is the container', () => {
    expect(distances(rect(20, 10, 100, 50), rect(0, 0, 200, 100)).map(s => s.length)).toEqual([10, 80, 40, 20]);
  });
  it('drops zero-length sides', () => {
    expect(distances(rect(0, 0, 200, 100), rect(0, 0, 100, 100)).map(s => s.length)).toEqual([100]);
  });
  it('returns nothing for partly overlapping boxes', () => {
    expect(distances(rect(0, 0, 100, 100), rect(50, 50, 100, 100))).toEqual([]);
  });
});

describe('formatLength', () => {
  it('rounds pixels and drops the unit', () => {
    expect(formatLength(13, 'px', 16)).toBe('13');
    expect(formatLength(13.6, 'px', 16)).toBe('14');
  });
  it('converts to rem with up to 3 decimals', () => {
    expect(formatLength(24, 'rem', 16)).toBe('1.5rem');
    expect(formatLength(13, 'rem', 16)).toBe('0.813rem');
    expect(formatLength(20, 'rem', 10)).toBe('2rem');
  });
});

describe('compactSides', () => {
  const f = String;
  it('collapses like the CSS shorthand', () => {
    expect(compactSides([8, 8, 8, 8], f)).toBe('8');
    expect(compactSides([13, 22, 13, 22], f)).toBe('13 22');
    expect(compactSides([1, 2, 3, 2], f)).toBe('1 2 3');
    expect(compactSides([1, 2, 3, 4], f)).toBe('1 2 3 4');
  });
});

describe('pillPosition', () => {
  it('sits above the element', () => {
    expect(pillPosition(rect(100, 100, 80, 40), 60, 19, 1000, 800)).toEqual({ x: 100, y: 75 });
  });
  it('drops below when there is no room above the ruler', () => {
    expect(pillPosition(rect(100, 10, 80, 40), 60, 19, 1000, 800)).toEqual({ x: 100, y: 56 });
  });
  it('stays on screen for elements taller than the viewport', () => {
    expect(pillPosition(rect(100, -50, 80, 2000), 60, 19, 1000, 800)).toEqual({ x: 100, y: 28 });
  });
  it('is clamped to the left ruler and right edge', () => {
    expect(pillPosition(rect(0, 100, 80, 40), 60, 19, 1000, 800).x).toBe(22);
    expect(pillPosition(rect(980, 100, 80, 40), 60, 19, 1000, 800).x).toBe(936);
  });
});

describe('panelSide', () => {
  it('stays right when the element is clear of the panel', () => {
    expect(panelSide(rect(100, 100, 200, 50), 280, 1280)).toBe('right');
  });
  it('moves left when the element is under the right-hand panel', () => {
    expect(panelSide(rect(1000, 100, 100, 50), 280, 1280)).toBe('left');
  });
  it('stays right when the element is too wide for either side', () => {
    expect(panelSide(rect(0, 0, 1280, 50), 280, 1280)).toBe('right');
  });
});
