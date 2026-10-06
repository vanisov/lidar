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

export async function loadSettings(): Promise<void> {
  const a = area();
  if (!a) return;
  const got = await a.get('settings');
  settings.value = sanitize(got.settings);
}

export function saveSettings(patch: Partial<Settings>): void {
  settings.value = { ...settings.value, ...patch };
  area()?.set({ settings: settings.value }).catch(() => {}); // e.g. the sync quota is full
}
