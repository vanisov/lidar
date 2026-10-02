export type RGBA = [r: number, g: number, b: number, a: number];

const byte = (v: number) => Math.round(v).toString(16).padStart(2, '0').toUpperCase();

export function toHex([r, g, b, a]: RGBA): string {
  return `#${byte(r)}${byte(g)}${byte(b)}${a < 1 ? byte(a * 255) : ''}`;
}

/** `over` composited on `under`; the result is opaque when `under` is. */
export function blend(over: RGBA, under: RGBA): RGBA {
  const a = over[3];
  return [over[0] * a + under[0] * (1 - a), over[1] * a + under[1] * (1 - a), over[2] * a + under[2] * (1 - a), a + under[3] * (1 - a)];
}

export function luminance([r, g, b]: RGBA): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}

/** WCAG 2 contrast ratio of `fg` drawn on an opaque `bg`. */
export function contrast(fg: RGBA, bg: RGBA): number {
  const [hi, lo] = [luminance(blend(fg, bg)), luminance(bg)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

export function grade(ratio: number, largeText: boolean): 'AAA' | 'AA' | 'Fail' {
  const [aa, aaa] = largeText ? [3, 4.5] : [4.5, 7];
  return ratio >= aaa ? 'AAA' : ratio >= aa ? 'AA' : 'Fail';
}
