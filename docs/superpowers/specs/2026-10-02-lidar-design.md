# Lidar: design

Date: 2026-10-02
Status: approved for spec review

## Goal

Lidar is a free, open-source (MIT) Chromium extension for measuring and inspecting web pages. It matches every
feature of [Screen Ruler](https://chromewebstore.google.com/detail/screen-ruler-measure-and/jfbbgijjljfbolelfkopkhbfjajjampm),
including its paid PRO tier, with nothing behind a paywall. It belongs to the same developer-tools family as Sonar and
shares Sonar's look.

Store listing: **"Lidar: Measure & Inspect the Web"**. Tagline: *Precision inspection for the web. Free, forever.*

Success means:
- A Chrome Web Store release that a Screen Ruler user can switch to without losing any feature.
- The UI is at least as polished as Screen Ruler's.
- Lidar costs nothing on a page until the user activates it, and hover tracking stays smooth (60 fps) on heavy pages.
- No analytics, no network requests, and no host permissions.

Before launch, the owner checks USPTO class 9 for a "LIDAR" trademark conflict. An unrelated 5-user scraper
extension named "Lidar" already exists on the store, which is acceptable.

## Releases

All features ship, in this order. Each release is its own implementation plan.

| Release | Features |
|---|---|
| 1.0 | **Measure:** element size, padding/margin overlay, distance between elements, rulers and crosshair, keyboard tree navigation. **Inspect:** tag/id/classes and breadcrumb, box model, computed CSS, copy CSS, color picker, element screenshot, context menu entry, settings |
| 1.1 | **Layout:** flex/grid overlays, layout column grid overlay, breakpoint detection, X-ray mode (outline every element), CSS selector search |
| 1.2 | **Editing:** live CSS editor with @media support, floating compare for up to 4 elements, Tailwind class generator, source stylesheet browser |
| 1.3 | **Visual details:** box shadow, gradient, animation and transition visualization; typography analysis; asset extraction; canvas inspection |
| 1.4 | **Audits:** contrast and a11y issues, SEO and meta tags, social previews (Facebook, X, LinkedIn), page weight, technology detection, responsive device emulator |

## Architecture

### Stack

- TypeScript, bundled by esbuild through a small `build.mjs`.
- Preact and `@preact/signals` for the panels. No other runtime dependencies.
- Plain CSS with design tokens (custom properties). No CSS framework.
- Manifest V3.

### Permissions

`activeTab`, `scripting`, `storage`, `contextMenus`. No host permissions, so the install prompt has no "read and change
all your data" warning.

### Pieces

- **`background.ts` (service worker).** It does three things:
  - The toggle (toolbar icon, `Alt+L` command, context menu): injects `content.js` into the active tab, or sends
    "close" if Lidar is already there.
  - Screenshots, through `chrome.tabs.captureVisibleTab`. The content script crops the result to the element.
  - Marks the icon as muted on pages that can't be scripted.
- **Content script, `content/core/`:**
  - `host.ts` creates one top-level custom element containing a closed Shadow DOM. Every Lidar node lives inside it, and
    it is removed completely on close.
  - `store.ts` holds the shared state as signals: active tool, hovered element, pinned element, compare set, settings.
  - `overlay.ts` is the engine for the hot path and uses no framework. One `pointermove` listener records the cursor.
    Each `requestAnimationFrame`, it calls `elementFromPoint` and `getBoundingClientRect` (it doesn't need computed style)
    and moves a fixed pool of reused nodes: highlight, padding and margin bands, size pill, distance lines, rulers,
    crosshair. Nothing is allocated per frame. `scroll` and `resize` mark the overlay as dirty, so it redraws in the
    same loop.
  - `keys.ts` holds the keyboard map.
- **Tools, `content/tools/<name>/`.** Each tool is a module that implements
  `{ id, key, icon, activate(), deactivate(), Panel? }`. The dock is built from the list of registered tools. Each later
  release adds tool modules without changing the core.
- **UI, `content/ui/`.** The Preact dock, inspector panel and settings sheet, plus `tokens.css`.

### Data flow

1. The pointer moves, the overlay engine reads layout, and the overlay nodes update. This path never involves Preact.
2. On click, `store.pinned` is set. The panel reads `getComputedStyle` once and renders.
3. Tools read and write `store`. The panels re-render when the signals they use change.

## Visual design ("Graphite")

The approved mockup is at `.superpowers/brainstorm/*/content/visual-direction.html` (option A).

- Surfaces are `#1f1f1f`, with inset hairline borders `#ffffff14`, a 16 px panel radius and soft drop shadows.
- The accent is the orange-red from Sonar's icon (`#ff5a36`). It is used for highlights, size pills, distance lines
  and the active tool.
- Box model colors: padding green `#5ac46a` at about 18% alpha, margin orange hatch `#f7a64a`, content blue `#4aa3ff`.
- Type: system UI font for labels and SF Mono / `ui-monospace` for values.
- Motion: about 150 ms fade and scale for the dock and panel, and quick transitions on the overlays. Everything respects
  `prefers-reduced-motion`. Nothing animates continuously.
- A light theme is available in settings. It uses the same tokens with different values.
- Accessibility: all panel text meets WCAG AA, and every control can be reached with the keyboard and has a label.

## Interaction

- **Activate:** click the toolbar icon, press `Alt+L`, or use the context menu entry "Inspect with Lidar". The context
  menu entry pins the element that was right-clicked. `Esc` closes Lidar and restores the page exactly as it was.
- **Measure (the default tool):** hovering outlines an element and shows its size, padding and margin. Clicking pins
  it. Holding `Alt` while hovering another element shows the distances from the pinned element.
- **Tree navigation:** `↑` selects the parent, `↓` the first child, `←` and `→` the siblings.
- **Tool shortcuts:** single keys in dock order: `M` measure, `D` distance, `G` grid, `C` color. Each dock button shows
  its key in a tooltip.
- **Panel:** docked to the right by default. It can be dragged anywhere, and it moves to the left side automatically if
  it would cover the pinned element. It can collapse to its header. Clicking any value copies it and shows a "Copied"
  confirmation.
- **Color picker:** uses the native `EyeDropper` API.
- **Settings**, stored in `chrome.storage.sync`: theme, units (px, or rem with a base size), shortcuts, rulers on or
  off.

## Edge cases

- **Pages that can't be scripted** (`chrome://`, the Web Store, PDF viewer, other extensions): the icon shows a muted
  state and a tooltip explains why.
- **iframes:** 1.0 measures each iframe as one box. Inspecting inside frames is deferred and would use `allFrames`
  injection.
- **Hostile page CSS:** the closed Shadow DOM, a `position: fixed` host at the maximum z-index, and `all: initial` on the
  host keep Lidar's UI intact.
- **SPA navigation:** if the pinned element leaves the DOM, the selection clears without an error.
- **Repeat activation:** the toggle is idempotent. A second injection sees that the host already exists and closes
  Lidar.

## Testing

- **Vitest** for pure logic: distance and box-model math, unit conversion, and later CSS-to-Tailwind and the contrast
  ratio.
- **Playwright** loads the unpacked extension into Chromium against `test/fixture.html`. It checks:
  - Activation.
  - Hover overlay geometry.
  - Pinning and panel values.
  - Keyboard navigation.
  - That `Esc` leaves the DOM unchanged.
  - A performance smoke test: hover across a page with 5,000 nodes and assert there are no long tasks.

## Out of scope for 1.0

Everything in releases 1.1 to 1.4. Also inspecting inside iframes, Firefox and Safari builds, and any account or sync
features.
