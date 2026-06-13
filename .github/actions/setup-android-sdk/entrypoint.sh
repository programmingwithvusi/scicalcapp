#!/bin/bash
set -euo pipefail

SDK_ROOT="${INPUT_SDK_ROOT:-/github/workspace/android-sdk}"
API_LEVEL="${INPUT_API_LEVEL:-33}"
BUILD_TOOLS="${INPUT_BUILD_TOOLS:-33.0.2}"

mkdir -p "$SDK_ROOT/cmdline-tools"
cd "$SDK_ROOT"
if [ ! -d cmdline-tools/latest ]; then
  wget -q https://dl.google.com/android/repository/commandlinetools-linux-9477386_latest.zip -O cmdline.zip
  unzip -q cmdline.zip -d cmdline-tools
  rm cmdline.zip
  mkdir -p cmdline-tools/latest
  mv cmdline-tools/cmdline-tools/* cmdline-tools/latest/ || true
else
  echo "Command-line tools already present; skipping download."
fi

# Accept licenses and install packages
yes | "$SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" --licenses || true
"$SDK_ROOT/cmdline-tools/latest/bin/sdkmanager" "platform-tools" "platforms;android-$API_LEVEL" "build-tools;$BUILD_TOOLS"

# Export environment variables for the workflow
echo "ANDROID_SDK_ROOT=$SDK_ROOT" >> /github/workspace/GITHUB_ENV
# PATH update
echo "PATH=$SDK_ROOT/platform-tools:$SDK_ROOT/cmdline-tools/latest/bin:\$PATH" >> /github/workspace/GITHUB_ENV

# Keep container step successful
exit 0
