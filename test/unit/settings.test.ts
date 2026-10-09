import { describe, expect, it, vi } from 'vitest';
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

describe('changes made while settings are still loading', () => {
  it('apply on top of the stored settings instead of being overwritten by them', async () => {
    let resolveGet!: (v: unknown) => void;
    const set = vi.fn(() => Promise.resolve());
    vi.stubGlobal('chrome', { storage: { sync: { get: () => new Promise(r => (resolveGet = r)), set } } });
    vi.resetModules();
    const s = await import('../../src/content/core/settings');

    const loading = s.loadSettings();
    s.saveSettings({ rulers: false });
    expect(set).not.toHaveBeenCalled(); // writing now would replace the stored theme with the default
    resolveGet({ settings: { theme: 'light', spreadMode: 'layout' } });
    await loading;

    expect(s.settings.value).toMatchObject({ theme: 'light', spreadMode: 'layout', rulers: false });
    expect(set).toHaveBeenCalledWith({ settings: s.settings.value });
    vi.unstubAllGlobals();
  });

  it('are kept when Lidar is reopened in the same page', async () => {
    let resolveGet!: (v: unknown) => void;
    let first = true;
    const get = () => (first ? Promise.resolve({}) : new Promise(r => (resolveGet = r)));
    vi.stubGlobal('chrome', { storage: { sync: { get, set: vi.fn(() => Promise.resolve()) } } });
    vi.resetModules();
    const s = await import('../../src/content/core/settings');

    await s.loadSettings();
    first = false;
    const loading = s.loadSettings();
    s.saveSettings({ grid: true });
    resolveGet({ settings: { grid: false } });
    await loading;

    expect(s.settings.value.grid).toBe(true);
    vi.unstubAllGlobals();
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
    s.saveSettings({ rulers: false });
    expect(set).not.toHaveBeenCalled(); // writing now would replace the stored theme with the default
    resolveGet({ settings: { theme: 'light', spreadMode: 'layout' } });
    await loading;

    expect(s.settings.value).toMatchObject({ theme: 'light', spreadMode: 'layout', rulers: false });
    expect(set).toHaveBeenCalledWith({ settings: s.settings.value });
    vi.unstubAllGlobals();
  });
});
