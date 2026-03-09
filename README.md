# barkoder_app_cordova

Cordova + React port of `BarkoderApp` (React Native), using the official Barkoder Cordova SDK.

## Included app flows

- Home modes grid (1D, 2D, Continuous, MultiScan, VIN, DPM, DeBlur, DotCode, AR, MRZ, Gallery)
- Native scanner screen with:
  - flash/zoom/camera toggles
  - pause-on-result behavior
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

## Notes

- `cordova.js` is loaded in `index.html` for native runtime.
- Native Barkoder APIs are wrapped in `src/plugins/barkoder.ts` to provide a promise-based interface.
- Settings/history are persisted in `localStorage`.
- CSV export is implemented as file download from the scanner screen.

## References used

- https://barkoder.com/docs/v1/cordova/cordova-installation
- https://barkoder.com/docs/v1/cordova/cordova-sdk-api-reference
- https://barkoder.com/docs/v1/cordova/cordova-examples

