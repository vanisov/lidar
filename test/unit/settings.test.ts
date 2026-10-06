import { describe, expect, it } from 'vitest';
import { DEFAULTS, sanitize } from '../../src/content/core/settings';

describe('sanitize', () => {
  it('returns defaults for missing storage', () => expect(sanitize(undefined)).toEqual(DEFAULTS));
  it('keeps valid values', () => {
    const s = {
      theme: 'light', units: 'rem', remBase: 10, rulers: false, spreadMode: 'layout', spreadTolerance: 20,
      grid: true, xray: true, columns: { count: 6, gutter: 0, margin: 400, maxWidth: 1200 },
    };
    expect(sanitize(s)).toEqual(s);
  });
  it('replaces invalid values with defaults', () => {
    expect(sanitize({
      theme: 'neon', units: 'em', remBase: 999, rulers: 'yes', spreadMode: 'x', spreadTolerance: 0,
      grid: 'yes', xray: 1, columns: { count: 0, gutter: -1, margin: 1.5, maxWidth: 5000 },
    })).toEqual(DEFAULTS);
  });
  it('fills in column fields missing from older saved settings', () => {
    expect(sanitize({ columns: { count: 6 } }).columns).toEqual({ ...DEFAULTS.columns, count: 6 });
    expect(sanitize({ columns: 'wide' }).columns).toEqual(DEFAULTS.columns);
  });
});
