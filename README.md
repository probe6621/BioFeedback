# BioFeedback

BioFeedback is a local-first daily wellness telemetry app built with React Native and Expo. The MVP focuses on a fast daily check-in flow that lets users log their current bio-charge tension and vector stability, review a rolling history, and generate a stylized tension card for quick reflection or social sharing.

## Why it exists

The app is designed to help users track energy, attention, and mental load in a compact, skunkworks-inspired UI. Instead of clinical dashboards, it emphasizes a minimal telemetry aesthetic with fast input, useful local storage, and a simple daily rhythm.

## Features

- Daily check-in dashboard with two live telemetry inputs
  - Bio-Charge Tension
  - Vector Stability
- Dynamic vector visualization for a lightweight physics-inspired feel
- Local history tracking with daily entries stored on-device
- Share-ready tension card preview
- Settings screen with app info, disclaimer, and Pro toggle concept
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
  VectorSlider.tsx
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

The app persists the daily check-in history locally using AsyncStorage. This keeps the MVP simple and private while still enabling a rolling 7-day view for the free tier experience.

## Notes

This project is intentionally a Phase 1 MVP focused on the core experience and the visual identity. It is not a medical diagnostic tool and should be treated as a self-tracking reflection app.

## Repository

- GitHub: https://github.com/probe6621/BioFeedback
