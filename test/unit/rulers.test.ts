import { describe, expect, it } from 'vitest';
import { rulerScale } from '../../src/content/core/rulers';

describe('rulerScale', () => {
  it('labels every 100px with 50px and 10px ticks', () => {
    const s = rulerScale('px', 16);
    expect([s.major, s.mid, s.minor]).toEqual([100, 50, 10]);
    expect(s.label(3)).toBe('300');
  });
  it('labels whole rems at a readable spacing', () => {
    const s = rulerScale('rem', 16); // 5rem = 80px is the first nice step ≥ 64px
    expect([s.major, s.mid, s.minor]).toEqual([80, 40, 8]);
    expect(s.label(2)).toBe('10rem');
  });
  it('adapts the rem step to the base size', () => {
    expect(rulerScale('rem', 10).major).toBe(100); // 10rem
    expect(rulerScale('rem', 64).major).toBe(64); // 1rem
  });
});
