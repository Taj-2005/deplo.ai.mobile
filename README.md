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

## Development workflow

Use Expo Go for the initial interface pass. For native modules or packages that
require custom native code, create a development build with EAS or a local
prebuild instead of relying on Expo Go.

When adding navigation, keep routes under `src/app/` and use the Expo Router
APIs for links and search parameters. Keep shared components outside the route
tree under `src/components/`.

When adding NativeWind styles, use semantic Deplo brand colors from
`tailwind.config.js` and verify the result on both native platforms and web.

## Commit conventions

Use conventional commit subjects with a single, descriptive scope:

```text
feat(mobile): add secure GitHub authentication for Android and iOS
fix(auth): preserve the verified session across app resume and cold starts
docs(readme): explain Expo Go limitations and native development builds
chore(deps): align all Expo packages with the installed SDK version
test(logs): cover stage filtering, search, and first-error navigation
```

Commit subjects must describe the implementation change and its user-facing or
technical purpose, use the imperative tense, remain readable at 72 characters
or fewer, and contain no AI or internal-tool attribution. Avoid vague subjects
such as `fix bug`, `update code`, or `add feature`.

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
