import type { Rect } from './geometry';

export interface Seg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

/** Everything the canvas draws in one frame. Plain data, rebuilt by the overlay on each dirty frame. */
export interface Scene {
  /** Column grid. */
  fills: Rect[];
  /** X-ray boxes and search matches. */
  outlines: Rect[];
  /** The current search match. */
  strong: Rect[];
  /** Flex and grid gaps. */
  hatches: Rect[];
  /** Flex/grid containers and flex items. */
  boxes: Rect[];
  /** Grid track edges and flex line breaks. */
  dashes: Seg[];
}

export const emptyScene = (): Scene => ({ fills: [], outlines: [], strong: [], hatches: [], boxes: [], dashes: [] });
