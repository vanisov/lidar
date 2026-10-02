import { contrast, grade, toHex, type RGBA } from './color';
import { compactSides, type Sides } from './geometry';

export interface ElementInfo {
  label: string;
  path: string[];
  selector: string;
  text: string;
  width: number;
  height: number;
  padding: Sides;
  margin: Sides;
  border: Sides;
  /** e.g. "Inter 14 / 600" */
  font: string;
  lineHeight: string;
  color: RGBA;
  /** Effective background: the element's layers composited down to the first opaque ancestor. */
  background: RGBA;
  largeText: boolean;
  styles: [string, string][];
}

export function label(tag: string, id: string, classes: string[]): string {
  return tag + (id ? `#${id}` : '') + classes.slice(0, 3).map(c => `.${c}`).join('');
}

type When = 'positioned' | 'layout';
/** [property, value pattern that means "default, hide it", only show when]. Order is the display order. */
const STYLE_PROPS: [string, RegExp | null, When?][] = [
  ['display', null], ['position', /^static$/],
  ['top', /^auto$/, 'positioned'], ['right', /^auto$/, 'positioned'], ['bottom', /^auto$/, 'positioned'], ['left', /^auto$/, 'positioned'],
  ['z-index', /^auto$/],
  ['width', null], ['height', null],
  ['min-width', /^(auto|0px)$/], ['max-width', /^none$/], ['min-height', /^(auto|0px)$/], ['max-height', /^none$/],
  ['box-sizing', /^content-box$/], ['padding', /^0px$/], ['margin', /^0px$/], ['border-top', /^0px/], ['border-right', /^0px/], ['border-bottom', /^0px/], ['border-left', /^0px/], ['border-radius', /^0px$/],
  ['outline', /none/],
  ['background-color', /^rgba\(0, 0, 0, 0\)$/], ['background-image', /^none$/], ['color', null], ['opacity', /^1$/],
  ['font-family', null], ['font-size', null], ['font-weight', null], ['font-style', /^normal$/], ['line-height', null],
  ['letter-spacing', /^normal$/], ['text-align', /^(start|left)$/], ['text-transform', /^none$/],
  ['text-decoration-line', /^none$/], ['white-space', /^normal$/],
  ['flex-direction', /^row$/, 'layout'], ['flex-wrap', /^nowrap$/, 'layout'], ['justify-content', /^normal$/, 'layout'],
  ['align-items', /^normal$/, 'layout'], ['gap', /^normal$/, 'layout'], ['grid-template-columns', /^none$/, 'layout'],
  ['grid-template-rows', /^none$/, 'layout'],
  ['flex', /^0 1 auto$/], ['align-self', /^auto$/], ['overflow', /^visible$/],
  ['box-shadow', /^none$/], ['transform', /^none$/], ['filter', /^none$/], ['backdrop-filter', /^none$/],
  ['transition', /^all 0s ease 0s$/], ['cursor', /^auto$/],
];

/** The computed styles worth showing and copying, minus the noise of defaults. */
export function interestingStyles(get: (prop: string) => string): [string, string][] {
  const layout = /flex|grid/.test(get('display'));
  const positioned = !/^(static|)$/.test(get('position'));
  const out: [string, string][] = [];
  for (const [prop, boring, when] of STYLE_PROPS) {
    if ((when === 'layout' && !layout) || (when === 'positioned' && !positioned)) continue;
    const v = get(prop).trim();
    if (!v || boring?.test(v)) continue;
    out.push([prop, v]);
  }
  return out;
}

export function cssRule(info: ElementInfo): string {
  return `${info.label} {\n${info.styles.map(([k, v]) => `  ${k}: ${v};`).join('\n')}\n}`;
}

/** Markdown brief of one element, written to be pasted into an AI coding agent. */
export function aiBrief(i: ElementInfo, url: string): string {
  const px = (n: number) => (n === 0 ? '0' : `${Math.round(n)}px`);
  const ratio = contrast(i.color, i.background);
  return [
    `## \`${i.label}\` on ${url}`,
    '',
    `- Selector: \`${i.selector}\``,
    `- DOM path: ${i.path.join(' › ')}`,
    i.text ? `- Text: "${i.text}"` : null,
    `- Size: ${Math.round(i.width)} × ${Math.round(i.height)} px`,
    `- Padding: ${compactSides(i.padding, px)} · Margin: ${compactSides(i.margin, px)}`,
    `- Font: ${i.font}, line-height ${i.lineHeight}`,
    `- Color ${toHex(i.color)} on ${toHex(i.background)} (contrast ${ratio.toFixed(2)}:1, ${grade(ratio, i.largeText)})`,
    '',
    'Computed styles:',
    '```css',
    cssRule(i),
    '```',
  ]
    .filter(line => line !== null)
    .join('\n');
}
