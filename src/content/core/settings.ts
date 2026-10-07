import { signal } from '@preact/signals';
import type { Units } from './geometry';

export interface Settings {
  theme: 'graphite' | 'light';
  units: Units;
  remBase: number;
  rulers: boolean;
  /** What the Spread tool's lines stop at: visible pixels, or element boxes. */
  spreadMode: 'visual' | 'layout';
  /** Visual mode: how different a pixel's color must be (per channel, 0–255) to count as an edge. */
  spreadTolerance: number;
}

export const DEFAULTS: Settings = {
  theme: 'graphite', units: 'px', remBase: 16, rulers: true, spreadMode: 'visual', spreadTolerance: 6,
};

export const settings = signal<Settings>(DEFAULTS);

/** Storage is user-writable (sync across devices, older versions), so never trust its shape. */
export function sanitize(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  return {
    theme: r.theme === 'light' ? 'light' : 'graphite',
    units: r.units === 'rem' ? 'rem' : 'px',
    remBase: typeof r.remBase === 'number' && r.remBase >= 1 && r.remBase <= 64 ? r.remBase : DEFAULTS.remBase,
    rulers: typeof r.rulers === 'boolean' ? r.rulers : DEFAULTS.rulers,
    spreadMode: r.spreadMode === 'layout' ? 'layout' : 'visual',
    spreadTolerance:
      typeof r.spreadTolerance === 'number' && r.spreadTolerance >= 1 && r.spreadTolerance <= 64
        ? r.spreadTolerance
        : DEFAULTS.spreadTolerance,
  };
}

const area = () => globalThis.chrome?.storage?.sync;

// Changes made before the stored settings arrive (pressing R or S right after opening) are held here and applied on
// top of them. Writing earlier would replace the user's stored settings with the defaults.
let loaded = false;
let early: Partial<Settings> = {};

const persist = () => area()?.set({ settings: settings.value }).catch(() => {}); // e.g. the sync quota is full

export async function loadSettings(): Promise<void> {
  const a = area();
  const got = a ? await a.get('settings') : {};
  loaded = true;
  settings.value = { ...sanitize(got.settings), ...early };
  if (Object.keys(early).length) void persist();
  early = {};
}

export function saveSettings(patch: Partial<Settings>): void {
  settings.value = { ...settings.value, ...patch };
  if (loaded) void persist();
  else early = { ...early, ...patch };
}
