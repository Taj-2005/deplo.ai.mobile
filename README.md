# Deplo Mobile

Official Expo and React Native boilerplate for the Deplo mobile application.

## Stack

- Expo SDK 58
- React 19
- React Native 0.88
- TypeScript
- NativeWind 4
- Tailwind CSS 3
- React Native Reanimated 4
- React Native Worklets
- Safe Area Context
- Expo Router

## Requirements

- Node.js 20 or newer
- npm
- iOS development requires macOS and Xcode
- Android development requires Android Studio

## Development

Install dependencies:

```bash
npm install
```

Start the Expo development server:

```bash
npm start
```

Start a platform directly:

```bash
npm run ios
npm run android
npm run web
```

## Validation

```bash
npm run typecheck
npm run lint
npm run doctor
```

## NativeWind

NativeWind utilities are enabled through `global.css`, `metro.config.js`, and
`tailwind.config.js`. Import `global.css` once in `src/app/_layout.tsx`.

Deplo brand colors and shared styles are configured in
`tailwind.config.js`.

## Project structure

```text
app.json             Expo application configuration
global.css           NativeWind and Tailwind directives
metro.config.js      Metro and NativeWind integration
tailwind.config.js   Tailwind and Deplo theme configuration
babel.config.js      Expo and Worklets Babel configuration
src/app/             Expo Router screens and layouts
assets/              Application icons and images
```
