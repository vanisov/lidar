# Security policy

## Supported versions

Only the latest version on the [Chrome Web Store](https://github.com/vanisov/lidar#readme) gets security fixes.

## Reporting a vulnerability

Please don't open a public issue. Use [Report a vulnerability](https://github.com/vanisov/lidar/security/advisories/new)
on the Security tab instead, which keeps the report private until it's fixed.

Include what you found, how to reproduce it, and which version you tested. Expect a reply within a week.

## What's in scope

Lidar has no host permissions, makes no network requests, and runs only on the tab where the user activates it.
The parts that matter most:

- **The content script:** anything that lets a web page read, drive or impersonate Lidar's UI, or reach the
  extension's APIs through it.
- **Screenshots:** `captureVisibleTab` capturing more than the user asked for, or a page triggering a capture.
- **The clipboard:** Lidar writing anything the user didn't ask it to copy.
- **The release pipeline:** the workflow that publishes to the Chrome Web Store.
