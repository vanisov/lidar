import { signal } from '@preact/signals';

export type ToolId = 'measure' | 'distance' | 'color';

export const tool = signal<ToolId>('measure');
export const pinned = signal<Element | null>(null);
export const altHeld = signal(false);
/** Set by the context menu: pin whatever is under the cursor on the next pointer move. */
export const pinNext = signal(false);
export const toastMsg = signal<{ text: string; n: number } | null>(null);

let n = 0;
export function toast(text: string): void {
  toastMsg.value = { text, n: ++n };
}
