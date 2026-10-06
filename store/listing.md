# Chrome Web Store listing

Paste each block into the matching field in the Developer Dashboard. The store renders plain text, so the
description below uses no markdown.

## Name (from the manifest)

Lidar: Measure & Inspect the Web

## Summary (132 characters max)

Measure, inspect and copy any element on the web. Every feature free, no account, no paywall. Fully open-source.

## Category

Developer Tools

## Description

I got sick of being forced to pay for tools developers shouldn't have to pay for. So I made my own: entirely free and fully open-source.

Lidar measures and inspects anything on a web page. Sizes, spacing, distances, colors, computed CSS. No account, no trial, no "Pro" tier, no upsell. Every feature is free, and it stays that way.

MEASURE
• Hover any element to see its size, padding and margin, drawn right on the page
• Click to pin it, then hold ⌥ (Option on Mac) or Alt and hover another element to see the exact distance between them
• Spread: lines shoot out from your cursor to the nearest edge in every direction. Switch between Visual (stops at what you see) and Layout (stops at element boxes)
• Numbered rulers with your cursor position marked on both
• Pixels or rem, your choice

INSPECT
• Box model, font, line height, colors and computed styles for any element
• WCAG contrast grade on every element
• Walk the page with the arrow keys: parent, child, siblings
• Works inside iframes, web components and page dialogs

COPY
• Click any value to copy it
• Copy CSS: a ready-to-paste rule for the pinned element
• Screenshot: a crisp image of just that element
• Copy for AI: a markdown brief of the element (selector, layout, styles, text) plus its screenshot, ready to paste into Claude Code, Cursor or any AI coding tool
• Built-in color picker

BUILT RIGHT
• Runs only when you click it. Until then it adds nothing to any page
• No "read all your data on all websites" permission
• No analytics, no tracking, no network requests, no servers
• Dark and light themes
• Keyboard first: M measure · D distance · S spread · C color · R rulers · Esc close

FREE, FOREVER, AND OPEN
Lidar is MIT-licensed and the code is public. Read it, fork it, improve it:
https://github.com/vanisov/lidar

More is coming, and all of it will be free: flex and grid overlays, a live CSS editor, Tailwind export, design-token export, accessibility and SEO audits, and more.

## Single purpose

Measure and inspect elements on web pages.

## Permission justifications

- **activeTab:** Lidar runs only on the tab where the user clicks its icon, presses its shortcut, or chooses "Inspect with Lidar".
- **scripting:** Injects Lidar's inspector into that tab when the user activates it.
- **storage:** Remembers the user's settings (theme, units, rulers, Spread mode) with chrome.storage.sync.
- **contextMenus:** Adds the "Inspect with Lidar" item to the right-click menu.

## Remote code

No. All code ships in the package.

## Data usage

Lidar collects no user data. Tick no data types, then tick all three certifications.

## URLs

- Homepage and support: https://github.com/vanisov/lidar
- Privacy policy: https://github.com/vanisov/lidar/blob/main/PRIVACY.md

## Images

- Icon: comes from the package (icons/128.png)
- Screenshots (1280×800): store/out/1-inspect.png … 5-copy-for-ai.png
- Small promo tile (440×280): store/out/promo-small-440x280.png
- Marquee (1400×560, optional): store/out/promo-marquee-1400x560.png
