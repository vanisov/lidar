# lidar

Precision inspection for the web. Free, forever.

Lidar measures and inspects anything on a web page: sizes, spacing, distances, colors, and computed CSS. It's a
free, open-source alternative to paid inspector extensions, and a sibling of [Sonar](https://github.com/vanisov/sonar).

## Use

| | |
|---|---|
| Open / close | Click the toolbar icon, press `Alt+L`, or right-click → **Inspect with Lidar**. `Esc` closes. |
| Measure | Hover anything. Click to pin it. |
| Distance | Pin an element, then hold `Alt` and hover another. |
| Navigate | `↑` parent · `↓` first child · `←` `→` siblings |
| Tools | `M` measure · `D` distance · `C` color picker · `R` rulers |
| Copy | Click any value. **Copy CSS**, **Copy for AI**, **Screenshot** in the panel. |

## Privacy

No analytics, no network requests, no host permissions. See [PRIVACY.md](PRIVACY.md).

## Build from source

```bash
npm install
npm run build          # dist/ — load it at chrome://extensions with "Load unpacked"
npm test               # unit tests
npm run e2e            # end-to-end tests against the real extension
npm run package        # lidar.zip for the Chrome Web Store
```

## License

MIT
