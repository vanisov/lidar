import { describe, expect, it, vi } from 'vitest';
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

describe('changes made while settings are still loading', () => {
  it('apply on top of the stored settings instead of being overwritten by them', async () => {
    let resolveGet!: (v: unknown) => void;
    const set = vi.fn(() => Promise.resolve());
    vi.stubGlobal('chrome', { storage: { sync: { get: () => new Promise(r => (resolveGet = r)), set } } });
    vi.resetModules();
    const s = await import('../../src/content/core/settings');

    const loading = s.loadSettings();
    s.saveSettings({ rulers: false }); // e.g. pressing R right after opening
    expect(set).not.toHaveBeenCalled(); // writing now would replace the stored theme with the default
    resolveGet({ settings: { theme: 'light', spreadMode: 'layout' } });
    await loading;

    expect(s.settings.value).toMatchObject({ theme: 'light', spreadMode: 'layout', rulers: false });
    expect(set).toHaveBeenCalledWith({ settings: s.settings.value });
    vi.unstubAllGlobals();
  });
});
