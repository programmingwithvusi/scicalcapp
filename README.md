# SciCalcApp

SciCalcApp is a small Cordova-based sample app (scientific calculator + simple device info screens).

This repository is intentionally browser-first: we build the Cordova `browser` platform and deploy the resulting `www/` folder to Netlify. Android support can be re-added later from a clean baseline.

## Goals

- Build and verify web assets (browser platform).
- Deploy `www/` to Netlify via GitHub Actions.
- Keep Android work separate and re-introduce it when ready.

---

## Quick start (local, browser)

Prerequisites

- Node.js 18+ (LTS)
- npm
- Cordova CLI (recommended to install globally)

Build for the browser platform locally:

```powershell
# from repository root
npx cordova platform add browser --no-save
npx cordova build browser
```

The generated static site will be in `www/` (this is what we deploy to Netlify).

Serve `www/` locally for a quick smoke test:

```powershell
npx http-server www -p 8000
# open http://localhost:8080
```

---

## Deploying to Netlify

Two ways to deploy `www/` to Netlify:

1. Local Netlify CLI (fast, manual)

```powershell
# install the CLI once (if needed)
npm install -g netlify-cli@9

# set your token for the session (safer than embedding it)
$secureToken = Read-Host "Netlify token (paste; not echoed)" -AsSecureString
$plain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureToken))
$env:NETLIFY_AUTH_TOKEN = $plain

# preview deploy (non-prod)
netlify deploy --dir=www --site <YOUR_SITE_ID>

# production deploy
netlify deploy --dir=www --prod --site <YOUR_SITE_ID>
```

2. GitHub Actions (automatic on push to `main`)

- Add these repository secrets (Settings → Secrets & variables → Actions):
  - `NETLIFY_AUTH_TOKEN` — Netlify personal access token or deploy token
  - `NETLIFY_SITE_ID` — your Netlify site ID
- Push to `main` and the workflow `.github/workflows/netlify-deploy.yml` will build and deploy `www/`.

Inspect the Actions run to view deploy logs and see the published URL printed by the Netlify CLI.

---

## Re-introducing Android (when ready)

If you want to add Android back later, do this locally first and verify:

```powershell
# add the android platform and build locally
npx cordova platform add android
npx cordova build android
```

For CI release-signing you'll need to provide signing material. Typical secret names for GitHub Actions:

- `ANDROID_KEYSTORE` — base64-encoded keystore
- `ANDROID_KEYSTORE_PASSWORD`
- `ANDROID_KEY_ALIAS`
- `ANDROID_KEY_PASSWORD`

Create the base64 value in PowerShell:

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\path\to\release.keystore')) > keystore.b64
# copy contents into the ANDROID_KEYSTORE secret
```

---

## Housekeeping notes

- This repository was cleaned of previous troubleshooting helpers and generated Android artifacts to provide a clear baseline for browser-first development.
- If you want the CI triage helper or icon generator restored, I can add a minimal `tools/` folder with just the scripts you want.
- If you'd like Netlify preview deploys for PRs (preview links) or PR comments with the preview URL, I can scaffold that next.

Tell me which of the above (restore helpers, PR preview deploys, or Android CI scaffolding) you'd like me to implement next and I'll do it.

# SciCalcApp

A small Cordova sample app (SciCalcApp) — menu-driven scientific calculator and system monitor.

## Quick start (local)

1. Ensure you have Java JDK 17, Android SDK, Node.js (18+), and Cordova CLI installed.
2. Install project dev dependencies (optional tools):

   ```powershell
   cd C:\Projects\Dev\imr4724\SciCalcApp
   cd tools; npm ci
   ```

3. Generate icons (tools script included):

   ```powershell
   node .\tools\generate-icons.js
   ```

4. Build & run on Android device/emulator:

   ```powershell
   cordova build android
   cordova run android
   ```

## Release signing (CI)

The CI workflow can produce a signed release APK. To enable signing, add the following GitHub repository secrets (Settings → Secrets → Actions):

- `ANDROID_KEYSTORE_BASE64` — base64-encoded contents of your Java keystore file (release.keystore)
- `ANDROID_KEYSTORE_PASSWORD` — keystore password
- `ANDROID_KEY_ALIAS` — alias name for the key inside the keystore
- `ANDROID_KEY_PASSWORD` — password for the key (often same as keystore password)

How to create the base64 string (PowerShell):

```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes('C:\path\to\release.keystore')) > ks.b64
# open ks.b64 and copy the contents into the ANDROID_KEYSTORE_BASE64 secret
```

## CI workflow (what it does)

- `build-web` job: regenerates icons and validates web assets.
- `android-build` job: installs JDK 17 and Android command-line tools, installs required SDK packages, builds debug & release APKs, and (when signing secrets are present) signs the release APK and uploads it as an artifact.

## Notes & recommendations

- The GitHub-hosted runner installs Android SDK at runtime; this increases CI time. For faster/reliable builds, use a self-hosted runner with Android SDK preinstalled.
- If you don't want to store keystore material in secrets, consider using a private self-hosted runner and keep the keystore on the runner instead.

## CI badge

To add a CI badge to this README replace `<OWNER>` and `<REPO>` with your GitHub details and copy the markdown below into the top of this README:

```markdown
[![CI](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml/badge.svg)](https://github.com/<OWNER>/<REPO>/actions/workflows/ci.yml)
```

## Support

If you want me to add Android SDK caching to accelerate CI runs, or to change the target SDK/build-tools versions used by the workflow, tell me which option you prefer and I'll update `.github/workflows/ci.yml` accordingly.
