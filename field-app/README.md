# Thunai Field App

Expo (React Native) app for ASHA / VAO field workers in rural Tamil Nadu.

## What it does

- **Login** with phone + OTP (mock — any 6-digit OTP works)
- **New citizen form** in Tamil — fills the same profile that Thunai's IVR asks for
- **Offline scheme matching** — bundles the KB JSON and runs JsonLogic locally
- **Scheme detail** — documents checklist, where to apply, helpline, QR code
- Uses the same matching engine logic as the backend

## Setup

```bash
cd field-app
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone, or press `a` for Android emulator / `i` for iOS simulator.

## Scheme data

The file `backend-schemes.json` contains a subset of schemes from the main KB
(`backend/scripts/schemes.json`). To update it, copy schemes from the main file.

## Project structure

```
field-app/
├── App.js                      — Root navigator (state-based)
├── app.json                    — Expo config
├── package.json                — Dependencies
├── backend-schemes.json        — Bundled scheme KB (subset)
└── src/
    ├── data/
    │   └── schemes.js          — Imports the bundled KB
    ├── engine/
    │   └── matcher.js          — JsonLogic matching (offline)
    └── screens/
        ├── LoginScreen.js      — Phone + OTP login
        ├── NewCitizenScreen.js — Tamil citizen profile form
        ├── MatchResultsScreen.js — Ranked scheme matches
        └── SchemeDetailScreen.js — Full scheme details + docs checklist
```

## Tech stack

- Expo SDK 50
- React Native 0.73
- json-logic-js (same as backend)
- No navigation library — uses simple state-based routing in App.js
