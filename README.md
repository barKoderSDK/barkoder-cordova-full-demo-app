# barkoder_app_cordova

Cordova + React, using the official Barkoder Cordova SDK.

## Included app flows

- Home modes grid (1D, 2D, Continuous, MultiScan, VIN, DPM, DeBlur, DotCode, AR, MRZ, Gallery)
- Native scanner screen with:
  - flash/zoom/camera toggles
  - bottom result sheet (copy / CSV / details / expand)
  - full settings panel (general, decoding, barcode-type toggles)
- Barcode details screen
- Recent scans history
- About screen (device + SDK/lib version)

## Tech stack

- Apache Cordova
- React + Vite + TypeScript
- `barkoder-cordova` plugin
- `cordova-plugin-camera` (gallery base64 picker)
- `cordova-plugin-device` (device identifier)

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create env file:

```bash
copy .env.example .env
```

Set:

```env
VITE_BARKODER_LICENSE_KEY=YOUR_BARKODER_LICENSE_KEY
```

Important:
- After changing `.env`, run a fresh build and sync: `npm run build && npm run cordova:prepare`.
- If you run from Android Studio using `platforms/android`, you must run `cordova prepare` (or `npm run cordova:build:android`) first so updated web assets are copied.
- The license key must be valid for this app id: `com.barkoder.demo` (from `config.xml`).

3. Build web bundle into Cordova `www`:

```bash
npm run build
```

4. Add platform(s) if missing:

```bash
npm run cordova:add:android
npm run cordova:add:ios
```

5. Build/run platform:

```bash
npm run cordova:build:android
npm run cordova:run:android
```

## References used

- https://barkoder.com/docs/v1/cordova/cordova-installation
- https://barkoder.com/docs/v1/cordova/cordova-sdk-api-reference
- https://barkoder.com/docs/v1/cordova/cordova-examples
