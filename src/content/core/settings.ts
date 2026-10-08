import { signal } from '@preact/signals';
import type { Units } from './geometry';

export interface Columns {
  count: number;
  gutter: number;
  margin: number;
  /** 0 means the full viewport width. */
  maxWidth: number;
}

export interface Settings {
  theme: 'graphite' | 'light';
  units: Units;
  remBase: number;
  rulers: boolean;
  spreadMode: 'visual' | 'layout';
  /** Visual mode: how different a pixel's color must be (per channel, 0–255) to count as an edge. */
  spreadTolerance: number;
  grid: boolean;
  xray: boolean;
  columns: Columns;
}

export const DEFAULTS: Settings = {
  theme: 'graphite', units: 'px', remBase: 16, rulers: true, spreadMode: 'visual', spreadTolerance: 6,
  grid: false, xray: false, columns: { count: 12, gutter: 24, margin: 24, maxWidth: 0 },
};

export const settings = signal<Settings>(DEFAULTS);

const int = (v: unknown, min: number, max: number, fallback: number) =>
  typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max ? v : fallback;

/** Storage is user-writable (sync across devices, older versions), so never trust its shape. */
export function sanitize(raw: unknown): Settings {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const c = (r.columns && typeof r.columns === 'object' ? r.columns : {}) as Record<string, unknown>;
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
    grid: r.grid === true,
    xray: r.xray === true,
    columns: {
      count: int(c.count, 1, 24, DEFAULTS.columns.count),
      gutter: int(c.gutter, 0, 200, DEFAULTS.columns.gutter),
      margin: int(c.margin, 0, 400, DEFAULTS.columns.margin),
      maxWidth: int(c.maxWidth, 0, 4000, DEFAULTS.columns.maxWidth),
    },
  };
}

const area = () => globalThis.chrome?.storage?.sync;

// Changes made before the stored settings load are held here; writing earlier would overwrite them with defaults.
let loaded = false;
let early: Partial<Settings> = {};

const persist = () => area()?.set({ settings: settings.value }).catch(() => {}); // e.g. the sync quota is full

export async function loadSettings(): Promise<void> {
  loaded = false; // module state outlives a session, so every open holds early changes until its own load lands
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
