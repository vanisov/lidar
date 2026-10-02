import { blend, type RGBA } from './color';
import { interestingStyles, label, type ElementInfo } from './describe';
import type { Sides } from './geometry';

let ctx: OffscreenCanvasRenderingContext2D | null = null;

/** Any CSS color (named, hex, oklch, color(display-p3 …)) as sRGB bytes, by painting one pixel. */
export function toRgba(css: string): RGBA {
  ctx ??= new OffscreenCanvas(1, 1).getContext('2d', { willReadFrequently: true })!;
  ctx.clearRect(0, 0, 1, 1);
  ctx.fillStyle = '#000';
  ctx.fillStyle = css;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b, Math.round((a / 255) * 100) / 100];
}

/** What's actually behind the element's text: its background layers composited down to an opaque one, or white. */
export function effectiveBackground(el: Element): RGBA {
  const layers: RGBA[] = [];
  for (let e: Element | null = el; e; e = e.parentElement) {
    const c = toRgba(getComputedStyle(e).backgroundColor);
    if (c[3] > 0) layers.push(c);
    if (c[3] >= 1) break;
  }
  return layers.reverse().reduce<RGBA>((under, over) => blend(over, under), [255, 255, 255, 1]);
}

export function ancestors(el: Element): Element[] {
  const chain: Element[] = [];
  for (let e: Element | null = el; e && e !== document.documentElement; e = e.parentElement) chain.unshift(e);
  return chain;
}

/** A selector that matches exactly this element, anchored at the nearest unique id. */
export function cssPath(el: Element): string {
  const parts: string[] = [];
  for (let e: Element | null = el; e && e !== document.documentElement; e = e.parentElement) {
    if (e.id && document.querySelectorAll(`#${CSS.escape(e.id)}`).length === 1) {
      parts.unshift(`#${CSS.escape(e.id)}`);
      break;
    }
    let part = e.tagName.toLowerCase() + [...e.classList].slice(0, 2).map(c => `.${CSS.escape(c)}`).join('');
    const parent = e.parentElement;
    if (parent && parent.querySelectorAll(`:scope > ${part}`).length > 1) {
      const tag = e.tagName;
      part += `:nth-of-type(${[...parent.children].filter(c => c.tagName === tag).indexOf(e) + 1})`;
    }
    parts.unshift(part);
  }
  return parts.join(' > ');
}

const nameOf = (e: Element) => label(e.tagName.toLowerCase(), e.id, [...e.classList]);

export function describe(el: Element): ElementInfo {
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  const n = (p: string) => parseFloat(cs.getPropertyValue(p)) || 0;
  const sides = (pre: string, post = ''): Sides =>
    [n(`${pre}-top${post}`), n(`${pre}-right${post}`), n(`${pre}-bottom${post}`), n(`${pre}-left${post}`)];
  const fontSize = n('font-size');
  const weight = cs.fontWeight;
  return {
    label: nameOf(el),
    path: ancestors(el).map(nameOf),
    selector: cssPath(el),
    text: (el.textContent ?? '').replace(/\s+/g, ' ').trim().slice(0, 120),
    width: r.width,
    height: r.height,
    padding: sides('padding'),
    margin: sides('margin'),
    border: sides('border', '-width'),
    font: `${cs.fontFamily.split(',')[0].replace(/["']/g, '').trim()} ${Math.round(fontSize)} / ${weight}`,
    lineHeight: cs.lineHeight,
    color: toRgba(cs.color),
    background: effectiveBackground(el),
    largeText: fontSize >= 24 || (fontSize >= 18.66 && Number(weight) >= 700),
    styles: interestingStyles(p => cs.getPropertyValue(p)),
  };
}
