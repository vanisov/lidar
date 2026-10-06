import type { ComponentChild } from 'preact';
import { pinned, toast, tool } from '../core/store';
import { saveSettings, settings, type Settings } from '../core/settings';
import { KEYS } from '../core/platform';
import { icons } from '../ui/icons';
import { pickColor } from './color';

export interface Tool {
  id: string;
  key: string;
  label: string;
  /** Toggles (like rulers) are styled as on/off rather than as the active tool. */
  toggle?: boolean;
  /** A short mode marker shown on the dock button. */
  badge?(): string;
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

export const TOOLS: Tool[] = [
  { id: 'measure', key: 'm', label: 'Measure', icon: icons.measure, isOn: () => tool.value === 'measure', run: () => { tool.value = 'measure'; } },
  {
    id: 'distance', key: 'd', label: `Distance (or hold ${KEYS.alt})`, icon: icons.distance, isOn: () => tool.value === 'distance',
    run: () => {
      tool.value = 'distance';
      if (!pinned.value) toast('Click an element to pin it, then hover another');
    },
  },
  {
    id: 'spread', key: 's', label: 'Spread (or hold ⇧) · S again switches Visual / Layout', icon: icons.spread,
    isOn: () => tool.value === 'spread',
    badge: () => (settings.value.spreadMode === 'visual' ? 'V' : 'L'),
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
];
