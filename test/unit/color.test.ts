import { describe, expect, it } from 'vitest';
import { blend, contrast, grade, toHex } from '../../src/content/core/color';

const white = [255, 255, 255, 1] as const;

describe('toHex', () => {
  it('formats opaque colors as #RRGGBB', () => expect(toHex([255, 90, 54, 1])).toBe('#FF5A36'));
  it('adds an alpha byte for translucent colors', () => expect(toHex([0, 0, 0, 0.5])).toBe('#00000080'));
});

describe('contrast', () => {
  it('is 21 for black on white', () => expect(contrast([0, 0, 0, 1], [...white])).toBeCloseTo(21, 5));
  it('matches WCAG for #777 and #767676 on white', () => {
    expect(contrast([119, 119, 119, 1], [...white])).toBeCloseTo(4.48, 2);
    expect(contrast([118, 118, 118, 1], [...white])).toBeCloseTo(4.54, 2);
  });
  it('blends translucent text over its background first', () => {
    expect(contrast([0, 0, 0, 0.5], [...white])).toBeCloseTo(3.98, 1);
  });
});

describe('blend', () => {
  it('composites over the background', () => expect(blend([0, 0, 0, 0.5], [...white])).toEqual([127.5, 127.5, 127.5, 1]));
});

describe('grade', () => {
  it('uses 4.5 / 7 for normal text', () => {
    expect(grade(4.48, false)).toBe('Fail');
    expect(grade(4.5, false)).toBe('AA');
    expect(grade(7.1, false)).toBe('AAA');
  });
  it('uses 3 / 4.5 for large text', () => expect(grade(4.48, true)).toBe('AA'));
});
