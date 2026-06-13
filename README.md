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
