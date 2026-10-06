import { signal } from '@preact/signals';

export type ToolId = 'measure' | 'distance' | 'spread' | 'color';

export const tool = signal<ToolId>('measure');
export const pinned = signal<Element | null>(null);
export const altHeld = signal(false);
/** Shift held in Measure mode spreads lines temporarily. */
export const shiftHeld = signal(false);
/** Set by the context menu: pin whatever is under the cursor on the next pointer move. */
export const pinNext = signal(false);
export const toastMsg = signal<{ text: string; n: number } | null>(null);

let n = 0;
export function toast(text: string): void {
  toastMsg.value = { text, n: ++n };
}

export interface Search {
  open: boolean;
  matches: Element[];
  /** The current match. */
  index: number;
  invalid: boolean;
}
const NO_SEARCH: Search = { open: false, matches: [], index: 0, invalid: false };
export const search = signal<Search>(NO_SEARCH);
export function closeSearch(): void {
  search.value = NO_SEARCH;
}
