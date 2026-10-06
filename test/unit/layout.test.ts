import { describe, expect, it } from 'vitest';
import { rect } from '../../src/content/core/geometry';
import { columnRects, flexDrawing, gridDrawing, parseTracks, trackSpans } from '../../src/content/core/layout';
import { DEFAULTS } from '../../src/content/core/settings';

describe('parseTracks', () => {
  it('reads resolved px tracks and drops line names', () => {
    expect(parseTracks('100px 200.5px')).toEqual([100, 200.5]);
    expect(parseTracks('[full-start] 100px [main] 50px [full-end]')).toEqual([100, 50]);
  });
  it('gives up on anything that is not a px list', () => {
    expect(parseTracks('none')).toBeNull();
    expect(parseTracks('subgrid')).toBeNull();
    expect(parseTracks('')).toBeNull();
  });
});

describe('trackSpans', () => {
  it('lays tracks from the start with gaps', () => {
    expect(trackSpans(0, 340, [100, 100, 100], 10, 'normal')).toEqual([
      { start: 0, end: 100 }, { start: 110, end: 210 }, { start: 220, end: 320 },
    ]);
  });
  it('shifts tracks that do not fill the container', () => {
    expect(trackSpans(0, 340, [100, 100, 100], 10, 'center')[0].start).toBe(10);
    expect(trackSpans(0, 340, [100, 100, 100], 10, 'end')[0].start).toBe(20);
    expect(trackSpans(0, 340, [100, 100, 100], 10, 'flex-end')[0].start).toBe(20);
  });
  it('never shifts tracks that overflow', () => {
    expect(trackSpans(5, 100, [100, 100], 0, 'center')[0].start).toBe(5);
  });
});

describe('RTL', () => {
  const cols = trackSpans(0, 420, [100, 200, 100], 10, 'normal', true);
  it('lays the first track at the right edge, running left', () => {
    expect(cols).toEqual([{ start: 320, end: 420 }, { start: 110, end: 310 }, { start: 0, end: 100 }]);
  });
  it('takes free space from the right', () => {
    expect(trackSpans(0, 440, [100, 100], 0, 'normal', true)[0].end).toBe(440);
    expect(trackSpans(0, 440, [100, 100], 0, 'end', true)[0].end).toBe(200);
  });
  it('numbers column lines from the right', () => {
    const m = gridDrawing(cols, trackSpans(0, 50, [50], 0, 'normal'), true).marks.filter(k => k.axis === 'col');
    expect(m.map(k => [k.text, k.x])).toEqual([['1', 420], ['2', 315], ['3', 105], ['4', 0]]);
  });
});

describe('gridDrawing', () => {
  const cols = trackSpans(0, 320, [100, 100, 100], 10, 'normal');
  const rows = [{ start: 0, end: 50 }];
  const d = gridDrawing(cols, rows);
  it('hatches the gaps between tracks', () => {
    expect(d.hatches).toEqual([rect(100, 0, 10, 50), rect(210, 0, 10, 50)]);
  });
  it('dashes both edges of every track', () => expect(d.dashes).toHaveLength(3 * 2 + 1 * 2));
  it('numbers each line, putting inner lines in the middle of their gap', () => {
    expect(d.marks.filter(m => m.axis === 'col').map(m => [m.text, m.x])).toEqual([['1', 0], ['2', 105], ['3', 215], ['4', 320]]);
    expect(d.marks.filter(m => m.axis === 'row').map(m => [m.text, m.y])).toEqual([['1', 0], ['2', 50]]);
  });
});

describe('flexDrawing', () => {
  const box = rect(0, 0, 300, 100);
  const at = (x: number, y: number) => rect(x, y, 80, 40);
  it('hatches gaps within each line and marks where a line wraps', () => {
    const d = flexDrawing(box, [at(0, 0), at(92, 0), at(184, 0), at(0, 52), at(92, 52)], true);
    expect(d.hatches).toEqual([rect(80, 0, 12, 40), rect(172, 0, 12, 40), rect(80, 52, 12, 40)]);
    expect(d.dashes).toEqual([{ x1: 0, y1: 46, x2: 300, y2: 46 }]);
  });
  it('works down a column', () => {
    const d = flexDrawing(box, [rect(0, 0, 50, 30), rect(0, 40, 50, 30)], false);
    expect(d.hatches).toEqual([rect(0, 30, 50, 10)]);
    expect(d.dashes).toEqual([]);
  });
  it('draws nothing for touching items', () => {
    expect(flexDrawing(box, [rect(0, 0, 50, 30), rect(50, 0, 50, 30)], true).hatches).toEqual([]);
  });
});

describe('columnRects', () => {
  it('splits the viewport minus margins into columns and gutters', () => {
    const r = columnRects(1280, 800, DEFAULTS.columns);
    expect(r).toHaveLength(12);
    expect(r[0].left).toBe(24);
    expect(r[11].right).toBeCloseTo(1256);
    expect(r[1].left - r[0].right).toBeCloseTo(24);
    expect(r[0].height).toBe(800);
  });
  it('centers a max-width grid', () => {
    expect(columnRects(1280, 800, { ...DEFAULTS.columns, maxWidth: 1000 })[0].left).toBe(140);
  });
  it('draws nothing when the columns cannot fit', () => {
    expect(columnRects(300, 800, { count: 24, gutter: 24, margin: 24, maxWidth: 0 })).toEqual([]);
  });
});
