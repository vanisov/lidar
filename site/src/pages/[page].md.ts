import type { APIRoute } from 'astro';
import readme from '../../../README.md?raw';
import changelog from '../../../CHANGELOG.md?raw';
import privacy from '../../../PRIVACY.md?raw';
import { STORE_URL, REPO_URL } from '../config/links';

const usage = readme.slice(readme.indexOf('## Use'), readme.indexOf('## Privacy')).trim();

const pages: Record<string, string> = {
  index: `# Lidar

> A free, open-source Chrome extension that measures sizes, spacing, distances and colors on any web page and reads
> you the computed CSS. No account, no paywall, no analytics.

- [Add to Chrome](${STORE_URL})
- [Source code](${REPO_URL}) (MIT)
- [Pricing](https://lidarcss.com/pricing.md): free, every feature
- [Changelog](https://lidarcss.com/changelog.md)
- [Privacy](https://lidarcss.com/privacy.md)

## What it does

- **Measure**: size, padding and margin of whatever you hover. Pin one, hold Alt, read the distance to the next.
- **Rulers & Spread**: numbered rulers with the cursor marked. Spread draws lines to the nearest edge, visual or layout.
- **Inspect**: box model, font, colors, computed styles and a WCAG contrast grade. Arrow keys walk the DOM.
- **Flex & grid overlays, column grid, breakpoints, X-ray, find by selector.**
- **Copy**: any value in one click, a ready CSS rule, an element screenshot, or a markdown brief for an AI coding tool.

${usage}
`,
  changelog,
  privacy: `${privacy.trim()}

## This website

lidarcss.com has no analytics, no cookies and no third-party scripts. Its fonts and images are served from this site.
`,
  pricing: `# Lidar pricing

Lidar is free. There is one plan and it has every feature.

| Plan | Price | Limits |
|---|---|---|
| Free | $0, forever | None. No account, no trial, no Pro tier, no usage caps. |

The code is MIT-licensed: ${REPO_URL}
`,
};

export const getStaticPaths = () => Object.keys(pages).map((page) => ({ params: { page } }));

export const GET: APIRoute = ({ params }) =>
  new Response(pages[params.page!], { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
