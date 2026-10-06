# Versioning and releases

## Versioning

Lidar follows [Semantic Versioning](https://semver.org): `MAJOR.MINOR.PATCH`.

| Bump | When | Example |
|---|---|---|
| **MAJOR** | A change that breaks how people already use Lidar: removing a tool, changing shortcuts, resetting settings | 1.4.0 → 2.0.0 |
| **MINOR** | New tools or visible behavior changes that keep everything working | 1.0.0 → 1.1.0 |
| **PATCH** | Bug fixes and performance work with no new features | 1.1.0 → 1.1.1 |

Commit types ([Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)) map onto this: a breaking change
means MAJOR, `feat` means MINOR, `fix` and `perf` mean PATCH. `docs`, `ci`, `chore` and repo config don't get a
release.

`package.json` holds the version. The build writes it into the extension's manifest, and the Chrome Web Store
rejects any upload whose version isn't higher than the published one.

## How to release

Releases happen by merging. No one tags or uploads by hand.

1. In the PR that should ship (or a separate one):
   - rename `## [Unreleased]` in `CHANGELOG.md` to `## [X.Y.Z] - YYYY-MM-DD`, add a fresh empty `## [Unreleased]`
     above it, and update the compare links at the bottom;
   - set `"version": "X.Y.Z"` in `package.json` (`npm version X.Y.Z --no-git-tag-version` does it);
   - commit it as `chore: release X.Y.Z`.
2. Merge the PR once CI is green.
3. The [release workflow](../.github/workflows/release.yml) sees a changelog version that isn't tagged yet. It:
   - checks that `package.json` has the same version;
   - builds `lidar.zip` on a clean runner;
   - creates the `vX.Y.Z` tag and the GitHub release, with that version's changelog section as the notes;
   - uploads the zip to the Chrome Web Store and submits it for review.
4. Google reviews it, usually within a few days. Once it's approved, Chrome updates every user automatically
   within a few hours.

Merges without a new version section build in CI but don't release anything.

To redo a release, push the tag yourself (`git tag vX.Y.Z && git push origin vX.Y.Z`); the same workflow rebuilds
and republishes it. The store step fails if that version was already uploaded, which is expected.

## Chrome Web Store setup (once)

The store step uses the [Chrome Web Store API v2](https://developer.chrome.com/docs/webstore/using-api) with a
service account. Until it's set up, releases still publish to GitHub and the store step skips itself with a notice.

1. **Google Cloud:** in the [Cloud console](https://console.cloud.google.com), create a project (or pick one) and
   enable the **Chrome Web Store API**.
2. **Service account:** under IAM & Admin → [Service accounts](https://console.cloud.google.com/iam-admin/serviceaccounts),
   create one (no roles needed), then Keys → Add key → Create new key → JSON. Keep the file private.
3. **Developer Dashboard:** in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole),
   open the **Account** section and add the service account's email. Note your **publisher ID**
   (Publisher → Settings) and Lidar's **item ID** (the 32-letter ID on its dashboard page).
4. **GitHub:** in the repo's Settings → Environments, create an environment named `chrome-web-store`, then add:
   - secret `CWS_SERVICE_ACCOUNT_JSON`: the whole JSON key file;
   - variable `CWS_PUBLISHER_ID`: the publisher ID;
   - variable `CWS_EXTENSION_ID`: the item ID.

To try the credentials without a release: `CWS_SERVICE_ACCOUNT_JSON="$(cat key.json)" CWS_PUBLISHER_ID=… CWS_EXTENSION_ID=… node scripts/publish-cws.mjs lidar.zip X.Y.Z`
uploads and submits that zip, so only run it with a version the store hasn't seen.

## Before merging a release, check

- `npm run typecheck`, `npm test` and `npm run e2e` pass (CI runs them).
- Load `dist/` in Chrome and try the changed tools by hand.
- New user-facing behavior is in the changelog.
- If the UI changed, re-render the store screenshots with `npm run store` and upload them in the dashboard.
