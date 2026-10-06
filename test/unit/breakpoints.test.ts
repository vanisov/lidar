import { describe, expect, it } from 'vitest';
import { mergeBreakpoints, widthsIn } from '../../src/content/core/breakpoints';

describe('widthsIn', () => {
  it('reads min- and max-width', () => {
    expect(widthsIn('(min-width: 768px)')).toEqual([768]);
    expect(widthsIn('screen and (min-width:640px) and (max-width: 1023.98px)')).toEqual([640, 1023.98]);
  });
  it('converts em and rem at 16px, ignoring the root font size', () => {
    expect(widthsIn('(min-width: 40em)')).toEqual([640]);
    expect(widthsIn('(max-width: 48rem)')).toEqual([768]);
  });
  it('reads range syntax on either side', () => {
    expect(widthsIn('(width >= 600px)')).toEqual([600]);
    expect(widthsIn('(400px <= width <= 700px)').sort((a, b) => a - b)).toEqual([400, 700]);
  });
  it('ignores heights, device widths and everything else', () => {
    expect(widthsIn('(min-height: 500px)')).toEqual([]);
    expect(widthsIn('(min-device-width: 500px)')).toEqual([]);
    expect(widthsIn('(device-width >= 500px)')).toEqual([]);
    expect(widthsIn('(prefers-color-scheme: dark)')).toEqual([]);
    expect(widthsIn('print')).toEqual([]);
  });
});

describe('mergeBreakpoints', () => {
  it('sorts, and merges points within 2px, keeping each query once', () => {
    expect(mergeBreakpoints([
      [1024, '@media (min-width: 1024px)'],
      [767.98, '@media (max-width: 767.98px)'],
      [768, '@media (min-width: 768px)'],
      [768, '@media (min-width: 768px)'],
    ])).toEqual([
      { px: 767.98, queries: ['@media (max-width: 767.98px)', '@media (min-width: 768px)'] },
      { px: 1024, queries: ['@media (min-width: 1024px)'] },
    ]);
  });
});
