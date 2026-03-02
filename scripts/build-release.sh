#!/bin/bash
set -e

# Build a signed, notarized release (DMG + ZIP) and create a draft GitHub release.
#
# Required environment variables:
#   APPLE_ID            – Apple ID email
#   APPLE_ID_PASSWORD   – app-specific password
#   APPLE_TEAM_ID       – Apple Developer team ID
#
# Prerequisites:
#   - gh CLI authenticated (gh auth login)
#   - Xcode command line tools installed
#
# Usage:
#   APPLE_ID=you@example.com APPLE_ID_PASSWORD=xxxx-xxxx-xxxx-xxxx APPLE_TEAM_ID=XXXXXXXXXX \
#     ./scripts/build-release.sh

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

# Validate required env vars
for var in APPLE_ID APPLE_ID_PASSWORD APPLE_TEAM_ID; do
  if [ -z "${!var}" ]; then
    echo "ERROR: $var is not set"
    exit 1
  fi
done

# Check gh is authenticated
if ! gh auth status &>/dev/null; then
  echo "ERROR: gh CLI is not authenticated. Run: gh auth login"
  exit 1
fi

VERSION=$(node -p "require('./package.json').version")
echo "==> Building Itsyconnect v$VERSION"

echo "==> Compiling Electron TypeScript..."
npm run electron:compile

echo "==> Building Next.js..."
npx next build

echo "==> Preparing standalone bundle..."
npm run electron:prepare

echo "==> Making DMG + ZIP (signing + notarizing)..."
npx electron-forge make

# Find outputs
DMG_PATH=$(find out/make -name "*.dmg" -type f | head -1)
ZIP_PATH=$(find out/make -name "*.zip" -type f | head -1)

if [ -z "$DMG_PATH" ]; then
  echo "ERROR: DMG not found in out/make/"
  exit 1
fi
if [ -z "$ZIP_PATH" ]; then
  echo "ERROR: ZIP not found in out/make/"
  exit 1
fi

DMG_SHA=$(shasum -a 256 "$DMG_PATH" | cut -d' ' -f1)

echo ""
echo "==> Build complete!"
echo "    DMG: $DMG_PATH"
echo "    ZIP: $ZIP_PATH"
echo "    SHA256 (DMG): $DMG_SHA"

echo ""
echo "==> Creating draft GitHub release v$VERSION..."
gh release create "v$VERSION" "$DMG_PATH" "$ZIP_PATH" \
  --title "v$VERSION" \
  --draft \
  --generate-notes

echo ""
echo "==> Done! Review the draft release on GitHub, then publish it."
echo "    https://github.com/nickustinov/itsyconnect-macos/releases"
