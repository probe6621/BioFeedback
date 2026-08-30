# BrainFriction

BrainFriction is a local-first daily telemetry app built with React Native and Expo. It combines live environmental inputs with a simple brain-state readout so users can understand how today feels at a glance.

## Why it exists

The app is designed to help users track energy, attention, and mental load in a compact, skunkworks-inspired UI. Instead of clinical dashboards, it emphasizes a minimal telemetry aesthetic with fast input, useful local storage, and a simple daily rhythm.

## Features

- The Science tab with an explainer for environmental drag and focus windows
- Daily dashboard with brain-state telemetry
  - Brain Pressure
  - Brain Stability
  - Combined Brain Score
- Pro auto-sync using location + weather inputs (temperature, humidity, barometric pressure, weather fronts)
- Pro custom alerts with configurable thresholds and toggles
  - High Pressure threshold
  - Low Stability threshold
  - Morning briefing / Heavy drag warning / Flow state ready
- Local history tracking with daily entries stored on-device
- Share-ready telemetry snapshot card
- Settings screen with Pro toggle and alert settings
- Built for Expo and React Native web/native development

## Project structure

```text
app/
  (tabs)/
    index.tsx
    history.tsx
    settings.tsx
  _layout.tsx
components/
  TensionCard.tsx
src/
  services/
    autoSync.ts
    alerts.ts
    notifications.ts
utils/
  storage.ts
```

## Tech stack

- React Native
- Expo
- Expo Router
- TypeScript
- AsyncStorage

## Getting started

1. Install dependencies:

```bash
npm install
```

2. Start the app:

```bash
npm start
```

3. For the web client:

```bash
npm run web
```

## Local storage

The app persists the daily history locally using AsyncStorage. This keeps the MVP simple and private while still enabling a rolling 7-day view for the free tier experience.

## Notes

This project is intentionally a Phase 1 MVP focused on the core experience and the visual identity. It is not a medical diagnostic tool and should be treated as a self-tracking reflection app.

## Repository

- GitHub: https://github.com/probe6621/BioFeedback
