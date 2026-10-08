# Contributing to Lidar

Thanks for helping. Lidar is small on purpose, so a few rules keep it that way.

## Principles

- **Free, all of it.** No paid tier, no accounts, no feature behind a paywall. Ever.
- **Nothing until asked.** Lidar adds no code and no listeners to a page until the user activates it, and `Esc`
  restores the page DOM exactly.
- **Fast on any page.** The overlay hot path stays out of Preact: one `requestAnimationFrame` loop, a fixed pool of
  nodes, layout reads before writes. The perf test hovers a 5,000-element page and allows no long tasks.
- **Private.** No analytics, no telemetry, no network requests, no host permissions.
- **Minimal.** Runtime dependencies are `preact` and `@preact/signals` only.

## Setup

You need Node 24 or later.

```bash
git clone https://github.com/vanisov/lidar
cd lidar
npm install
npx playwright install chromium
npm run build          # dist/: load it at chrome://extensions → Developer mode → Load unpacked
npm run watch          # rebuild on save (reload the extension in Chrome after each build)
```

## Before you open a PR

```bash
npm run typecheck
npm test               # unit tests (pure logic)
npm run e2e            # end-to-end tests against the real extension in Chromium
```

CI runs all three on every PR.

## Project layout

```
src/background.ts            service worker: toggle, context menu, screenshot capture
src/content/mount.tsx        builds the host, overlay, keys and UI; close() tears it all down
src/content/core/            overlay engine, keys, DOM reading, and the pure logic (unit-tested)
src/content/tools/           dock tools; add new tools to registry.ts
src/content/ui/              Preact UI: app.tsx, icons.tsx, and styles.css tokens
  components/                one component per file, grouped by area: dock/, panel/, settings/
  hooks/                     use-*.ts: behavior that isn't rendering (press-and-hold, menus, drag, screenshots)
  utils/                     small helpers shared by components
test/unit/                   Vitest, pure modules
test/e2e/                    Playwright against a deliberately hostile fixture page
store/                       Chrome Web Store screenshots and listing (`npm run store`)
site/                        lidarcss.com, Astro + Tailwind (`cd site && npm run dev`)
  src/sections/              the page's sections, top to bottom
  src/components/            layout/ (header, footer, rows), ui/, blueprint/ (notes, dimensions), overlay/
  src/scripts/               browser behavior, one module per component that needs it
  src/utils/, src/config/    pure helpers; links
```

- File and folder names are kebab-case (`tool-button.tsx`, `use-menu.ts`); one component per file.
- Pure logic (math, parsing, formatting) goes in its own module with a unit test.
- Anything visible or interactive gets an e2e test. Use `el.style.cssText` in tests, not `setAttribute('style')`:
  the fixture page has a strict CSP, on purpose.
- Styles load only through `adoptedStyleSheets` so strict page CSPs can't break Lidar.
- No functional text below 11px.

## Pull requests

- One change per PR. Small PRs get reviewed faster.
- Title the PR like a commit message (see below). Add the version for release PRs: `feat: grid overlays (1.1.0)`.
- Describe what changed and why, and attach a screenshot for anything visible.
- If it's user-facing, add a line under `## [Unreleased]` in [`CHANGELOG.md`](CHANGELOG.md). CI fails a PR that
  changes `src/` or `static/` without touching the changelog; add the `skip-changelog` label for changes users
  won't notice.

## Commit messages and PR titles

Commits and PR titles follow [Conventional Commits 1.0.0](https://www.conventionalcommits.org/en/v1.0.0/).

```
<type>[optional scope][!]: <description>
```

- **Types:** `feat`, `fix`, `perf`, `refactor`, `docs`, `test`, `ci`, `build`, `chore`.
- **Scope** is optional: `feat(spread): add a tolerance slider`.
- **Description:** lowercase, imperative, no trailing period.
- **Breaking changes** add `!` after the type or scope, or a `BREAKING CHANGE:` footer.
- **Versions:** `fix` means a PATCH release, `feat` a MINOR one, a breaking change a MAJOR one. See
  [docs/RELEASING.md](docs/RELEASING.md).

## Code style

- Match the surrounding code.
- Prefer deleting code to adding it. No abstractions for a single use.

### Comments

Most code needs no comment. Write one only when a careful reader, without it, would likely get the code wrong or
waste real time. That means:

- a reason the code can't show: a Chrome or browser quirk, a page CSP, a workaround, a performance limit;
- a rule the code depends on but doesn't state: an order that matters, an invariant, a unit;
- a choice that looks wrong but is deliberate, so nobody "fixes" it.

Don't write comments that:

- repeat what the code, a name or a type already says;
- narrate the next few lines, or label sections of a file;
- record history ("used to", "now", "moved from"). That belongs in the commit message.

Keep the ones you write short, usually one line. If a comment needs a paragraph, try a clearer name or a smaller
function first.

## Reporting bugs

Use the [bug report form](https://github.com/vanisov/lidar/issues/new?template=bug_report.yml). Include the page URL
if it's public: most bugs depend on the page.

## Releases

See [docs/RELEASING.md](docs/RELEASING.md).
