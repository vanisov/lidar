import { signal } from '@preact/signals';

export type ToolId = 'measure' | 'distance' | 'spread' | 'color';

export const tool = signal<ToolId>('measure');
export const pinned = signal<Element | null>(null);
export const altHeld = signal(false);
/** Shift held in Measure mode spreads lines temporarily. */
export const shiftHeld = signal(false);
/** Set by the context menu: pin whatever is under the cursor on the next pointer move. */
export const pinNext = signal(false);
/** The tool whose options flyout is open in the dock, if any. */
export const flyout = signal<string | null>(null);
export const toastMsg = signal<{ text: string; n: number } | null>(null);

let n = 0;
export function toast(text: string): void {
  toastMsg.value = { text, n: ++n };
}
