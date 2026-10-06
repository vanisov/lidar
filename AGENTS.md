# Instructions for AI agents

Read [CONTRIBUTING.md](CONTRIBUTING.md) first. It applies to you too.

## Project map

| File | What it does |
|---|---|
| `src/background.ts` | Toggle, context menu, screenshot capture, shortcuts page |
| `src/content/mount.tsx` | Builds the host, overlay, keys and UI; `close()` tears it all down |
| `src/content/core/overlay.ts` | The hot path: one rAF loop, fixed node pool, page pointer input |
| `src/content/core/geometry.ts`, `color.ts`, `describe.ts`, `spread.ts`, `rulers.ts`, `platform.ts`, `layout.ts`, `breakpoints.ts` | Pure logic, unit-tested |
| `src/content/core/paint.ts` | The one canvas: paints a `Scene` (column grid, X-ray, flex/grid, search) each dirty frame |
| `src/content/core/snapshot.ts`, `boxes.ts` | Spread's page pixels (Visual) and element boxes (Layout) |
| `src/content/core/inspect.ts` | Reads an element from the DOM into `ElementInfo` |
| `src/content/tools/registry.ts` | Dock tools; add new tools here |
| `src/content/ui/` | Preact dock, panel, settings, toast, and `styles.css` tokens |

## Rules

- Nothing runs on a page until the user activates Lidar, and `Esc` must restore the page DOM exactly.
- Keep Preact out of the overlay hot path.
- Load styles only through `adoptedStyleSheets` so strict page CSPs can't break Lidar.
- No functional text below 11 px.
- No new runtime dependencies, no analytics, no network requests.
- Run `npm run typecheck && npm test && npm run e2e` before committing.
- Commits and PR titles follow Conventional Commits (see CONTRIBUTING.md).
- User-facing changes add a line under `## [Unreleased]` in CHANGELOG.md.
- Don't tag, upload to the Chrome Web Store, or edit `version` outside a release PR: merging a PR with a new
  `## [X.Y.Z]` changelog section releases it (see docs/RELEASING.md). Never merge your own PRs.
