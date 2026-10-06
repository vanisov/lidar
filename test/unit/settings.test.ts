import { describe, expect, it } from 'vitest';
import { DEFAULTS, sanitize } from '../../src/content/core/settings';

describe('sanitize', () => {
  it('returns defaults for missing storage', () => expect(sanitize(undefined)).toEqual(DEFAULTS));
  it('keeps valid values', () => {
    const s = { theme: 'light', units: 'rem', remBase: 10, rulers: false, spreadMode: 'layout', spreadTolerance: 20 };
    expect(sanitize(s)).toEqual(s);
  });
  it('replaces invalid values with defaults', () => {
    expect(sanitize({ theme: 'neon', units: 'em', remBase: 999, rulers: 'yes', spreadMode: 'x', spreadTolerance: 0 })).toEqual(DEFAULTS);
  });
});
