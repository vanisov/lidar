import type { ComponentChild } from 'preact';
import { pinned, toast, tool } from '../core/store';
import { saveSettings, settings } from '../core/settings';
import { icons } from '../ui/icons';
import { pickColor } from './color';

export interface Tool {
  id: string;
  key: string;
  label: string;
  /** Toggles (like rulers) are styled as on/off rather than as the active tool. */
  toggle?: boolean;
  icon(): ComponentChild;
  isOn(): boolean;
  run(): void | Promise<void>;
}

export const TOOLS: Tool[] = [
  { id: 'measure', key: 'm', label: 'Measure', icon: icons.measure, isOn: () => tool.value === 'measure', run: () => { tool.value = 'measure'; } },
  {
    id: 'distance', key: 'd', label: 'Distance (or hold Alt)', icon: icons.distance, isOn: () => tool.value === 'distance',
    run: () => {
      tool.value = 'distance';
      if (!pinned.value) toast('Click an element to pin it, then hover another');
    },
  },
  { id: 'color', key: 'c', label: 'Color picker', icon: icons.color, isOn: () => tool.value === 'color', run: pickColor },
  {
    id: 'rulers', key: 'r', label: 'Rulers', toggle: true, icon: icons.rulers, isOn: () => settings.value.rulers,
    run: () => {
      const on = !settings.value.rulers;
      saveSettings({ rulers: on });
      toast(on ? 'Rulers on' : 'Rulers off');
    },
  },
];
