export interface Breakpoint {
  px: number;
  queries: string[];
}

// Media queries resolve em/rem against the initial font size, never the page's root font size.
const PX: Record<string, number> = { px: 1, em: 16, rem: 16 };
const NUM = '([\\d.]+)(px|em|rem)';
const PATTERNS = [
  new RegExp(`(?<![\\w-])(?:min|max)-width\\s*:\\s*${NUM}`, 'gi'),
  new RegExp(`(?<![\\w-])width\\s*(?:<=|>=|<|>|=)\\s*${NUM}`, 'gi'),
  new RegExp(`${NUM}\\s*(?:<=|>=|<|>|=)\\s*width(?![\\w-])`, 'gi'),
];

/** The viewport widths, in px, that a media query switches at. */
export function widthsIn(media: string): number[] {
  const out: number[] = [];
  for (const re of PATTERNS) for (const m of media.matchAll(re)) out.push(parseFloat(m[1]) * PX[m[2].toLowerCase()]);
  return out;
}

/** Sorted, with points within 2px merged (max-width: 767.98px and min-width: 768px are one breakpoint). */
export function mergeBreakpoints(found: [px: number, query: string][]): Breakpoint[] {
  const out: Breakpoint[] = [];
  for (const [px, query] of [...found].sort((a, b) => a[0] - b[0])) {
    const last = out[out.length - 1];
    if (last && px - last.px <= 2) {
      if (!last.queries.includes(query)) last.queries.push(query);
    } else out.push({ px, queries: [query] });
  }
  return out;
}

/** Every viewport-width breakpoint in the page's stylesheets. Cross-origin sheets can't be read; they're counted. */
export function scanBreakpoints(): { points: Breakpoint[]; unreadable: number } {
  const found: [number, string][] = [];
  let unreadable = 0;
  const add = (media: string) => {
    for (const px of widthsIn(media)) found.push([px, `@media ${media}`]);
  };
  const walkRules = (rules: CSSRuleList) => {
    for (const r of rules) {
      if (r instanceof CSSImportRule) {
        if (r.styleSheet) walkSheet(r.styleSheet);
      } else {
        if (r instanceof CSSMediaRule) add(r.media.mediaText);
        // Style rules can nest @media too (Tailwind v4), and aren't CSSGroupingRules.
        const nested = (r as CSSGroupingRule).cssRules;
        if (nested) walkRules(nested);
      }
    }
  };
  const walkSheet = (sheet: CSSStyleSheet) => {
    if (sheet.media.mediaText) add(sheet.media.mediaText); // <link media="…"> and @import … media
    let rules: CSSRuleList;
    try {
      rules = sheet.cssRules;
    } catch {
      unreadable++; // cross-origin; Lidar never fetches it
      return;
    }
    walkRules(rules);
  };
  for (const s of document.styleSheets) walkSheet(s);
  for (const s of document.adoptedStyleSheets) walkSheet(s);
  return { points: mergeBreakpoints(found), unreadable };
}
