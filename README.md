# HydroSmart

HydroSmart is an IoT-powered automated nutrient dosing controller built for hydroponic farming systems. It continuously monitors the water quality in your reservoir and automatically adjusts nutrient and pH levels to keep crops healthy — with zero daily babysitting.

> Mobile companion app for the HydroSmart ESP32 controller, developed as part of the Embedded Systems Project at the Kwame Nkrumah University of Science and Technology (KNUST).

## Features

- **Real-time monitoring** — live pH, EC, temperature, battery and Wi-Fi telemetry
- **Automatic dosing** — set target pH and EC values; the ESP32 maintains them automatically
- **Manual override** — full pump, valve and relay control on demand
- **History & analytics** — sensor trends over 24h, 7d and 30d
- **Discovery & pairing** — scan for devices on your network or connect by IP with a secure pairing code
- **Theme support** — light and dark mode
- **Simulated device backend** — includes a mock ESP32 service so the app runs end-to-end without hardware

## Tech Stack

- **Expo (React Native)** — SDK 54
- **React 19** / **TypeScript**
- **zustand** with AsyncStorage persistence
- **react-native-svg** for charts and gauges
- **lucide-react-native** for icons

## Getting Started

```bash
npm install
npm start
```

Scan the QR code with the Expo Go app on your phone (or press `a` for an Android emulator).

> **Note:** Expo Go on the Play Store currently supports **SDK 54**. If the project reports a version mismatch, make sure you have the latest Expo Go build.

## Project Structure

```
src/
├── App.tsx               # Navigation, bottom tabs, gauge
├── components/           # Chart + themed UI primitives
├── hooks/useESP32.ts     # Device polling + control actions
├── screens/              # Dashboard, Control, History, Discovery, Pairing, Settings, About, Help
├── services/esp32.ts     # Device API (mock + real firmware endpoints)
├── store/useAppStore.ts  # Global state (theme, targets, connection, pairing)
└── theme.ts              # Light/dark color system
```

## License

© 2026 HydroSmart Team. All rights reserved.
