# Changelog

All notable changes to Lidar. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
versions follow [Semantic Versioning](https://semver.org).

## [Unreleased]

### Added
- Flex and grid overlays: hover a flex or grid container to see its tracks, gaps and line numbers. Pin it to see its
  layout in the panel.
- Column grid (G): a design column grid over the page. Set columns, gutter, margin and max width in Settings.
- Breakpoints: the page's media-query widths are marked on the top ruler, with the current range highlighted.
- X-ray (X): outlines every element on screen.
- Find by selector (/): highlights every match. Arrow keys step through them and Enter pins one.

### Changed
- New icon: an L-shaped ruler with an orange cursor dot, with a simpler version for the 16 px toolbar size. It's
  padded to Chrome's icon guidelines, so it no longer looks oversized next to other extensions.
- New look: warm dark and light themes, IBM Plex Mono for values and keys (bundled, so no network requests), and the new mark in the dock.
- Dock tooltips show every tool's shortcut the same way. Spread's Visual / Layout choice moved from a letter badge to a corner flyout: press and hold or right-click the tool.

### Fixed
- Changing a setting right after opening or reopening Lidar (pressing R or S straight away) no longer resets your other saved
  settings, like the theme.

## [1.0.0] - 2026-10-02

### Added
- Measure any element: size, padding, margin, and distances to other elements (hold ⌥ on a Mac, Alt elsewhere).
- Spread: lines from the cursor to the nearest edge in each direction, stopping at what you see (Visual) or at element boxes (Layout).
- Numbered rulers, with the cursor's position marked on both.
- Rulers with crosshair and cursor coordinates.
- Inspector: box model, font, colors, contrast grade, computed styles, breadcrumb, and arrow-key tree navigation.
- Copy any value, Copy CSS, element screenshots, and Copy for AI (a markdown brief plus screenshot).
- Color picker.
- Graphite and Light themes, px or rem units.
- Contrast is marked approximate (≈) when a background image sits behind the text.
- Lidar's shortcut keys never steal typing from page fields.
- iframes are measured and pinned as one box.
- Elements inside web components (open shadow DOM) can be inspected.
- Lidar stays on top of, and usable over, page dialogs and popovers.

[Unreleased]: https://github.com/vanisov/lidar/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/vanisov/lidar/releases/tag/v1.0.0
