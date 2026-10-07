import type { ComponentChild } from 'preact';
import { closeSearch, pinned, search, toast, tool } from '../core/store';
import { saveSettings, settings, type Settings } from '../core/settings';
import { KEYS } from '../core/platform';
import { icons } from '../ui/icons';
import { pickColor } from './color';

export interface ToolOption {
  label: string;
  hint: string;
  isOn(): boolean;
  select(): void;
}

export interface Tool {
  id: string;
  key: string;
  label: string;
  /** A modifier that works the tool while held, shown in the tooltip next to the key. */
  hold?: string;
  /** The current mode, shown in the tooltip and the accessible name. */
  detail?(): string;
  /** Sub-options, Photoshop-style: a corner triangle on the button, and a flyout on press-and-hold or right-click. */
  options?: ToolOption[];
  /** Toggles (like rulers) are styled as on/off rather than as the active tool. */
  toggle?: boolean;
  icon(): ComponentChild;
  isOn(): boolean;
  run(): void | Promise<void>;
}

const toggle = (key: 'rulers' | 'grid' | 'xray', name: string) => () => {
  const on = !settings.value[key];
  const patch: Partial<Settings> = {};
  patch[key] = on; // a computed `{ [key]: on }` widens to an index signature that Partial<Settings> rejects
  saveSettings(patch);
  toast(`${name} ${on ? 'on' : 'off'}`);
};

const spreadMode = (mode: 'visual' | 'layout') => () => {
  tool.value = 'spread';
  saveSettings({ spreadMode: mode });
  toast(`Spread: ${mode === 'visual' ? 'Visual' : 'Layout'}`);
};

export const TOOLS: Tool[] = [
  { id: 'measure', key: 'm', label: 'Measure', icon: icons.measure, isOn: () => tool.value === 'measure', run: () => { tool.value = 'measure'; } },
  {
    id: 'distance', key: 'd', label: 'Distance', hold: KEYS.alt, icon: icons.distance, isOn: () => tool.value === 'distance',
    run: () => {
      tool.value = 'distance';
      if (!pinned.value) toast('Click an element to pin it, then hover another');
    },
  },
  {
    id: 'spread', key: 's', label: 'Spread', hold: '⇧', icon: icons.spread,
    isOn: () => tool.value === 'spread',
    detail: () => (settings.value.spreadMode === 'visual' ? 'Visual' : 'Layout'),
    options: [
      { label: 'Visual', hint: 'Stops at what you see', isOn: () => settings.value.spreadMode === 'visual', select: spreadMode('visual') },
      { label: 'Layout', hint: 'Stops at element boxes', isOn: () => settings.value.spreadMode === 'layout', select: spreadMode('layout') },
    ],
    run: () => {
      const mode = settings.value.spreadMode;
      if (tool.value !== 'spread') {
        tool.value = 'spread';
        toast(`Spread: ${mode === 'visual' ? 'Visual' : 'Layout'} · press S again to switch`);
        return;
      }
      const next = mode === 'visual' ? 'layout' : 'visual';
      saveSettings({ spreadMode: next });
      toast(`Spread: ${next === 'visual' ? 'Visual' : 'Layout'}`);
    },
  },
  { id: 'color', key: 'c', label: 'Color picker', icon: icons.color, isOn: () => tool.value === 'color', run: pickColor },
  {
    id: 'rulers', key: 'r', label: 'Rulers', toggle: true, icon: icons.rulers, isOn: () => settings.value.rulers,
    run: toggle('rulers', 'Rulers'),
  },
  { id: 'grid', key: 'g', label: 'Column grid', toggle: true, icon: icons.grid, isOn: () => settings.value.grid, run: toggle('grid', 'Column grid') },
  { id: 'xray', key: 'x', label: 'X-ray: outline every element', toggle: true, icon: icons.xray, isOn: () => settings.value.xray, run: toggle('xray', 'X-ray') },
  {
    id: 'search', key: '/', label: 'Find by CSS selector', toggle: true, icon: icons.search, isOn: () => search.value.open,
    run: () => (search.value.open ? closeSearch() : (search.value = { ...search.value, open: true })),
  },
];
