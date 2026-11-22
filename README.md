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
- Expo Notifications
- Expo SecureStore
- Expo Local Authentication
- Expo EAS build profiles

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

## Environment

Copy `.env.example` to `.env.local` for local overrides:

```bash
cp .env.example .env.local
```

The mobile API client defaults to the production Deplo origin:

```text
https://www.deplo.in
```

Set `EXPO_PUBLIC_API_URL` only for a trusted staging or development origin.
Values prefixed with `EXPO_PUBLIC_` are included in the client bundle; provider
credentials, provider API keys, and deployment secrets must never be placed in
mobile environment variables.

## Demo mode

The mobile frontend runs from local fixture data by default:

```dotenv
EXPO_PUBLIC_DEMO_MODE=true
EXPO_PUBLIC_API_URL=https://www.deplo.in
```

Demo mode:

- Opens directly into the mobile interface
- Uses local projects, deployments, logs, monitoring, and alert fixtures
- Displays a visible demo banner
- Prevents OAuth, retry, redeploy, cancel, and environment submissions from
  changing a real server deployment
- Clears OAuth and mutation behavior from the submission demo

Set `EXPO_PUBLIC_DEMO_MODE=false` only after the Deplo backend provides the
documented mobile authentication and API contracts.

## Validation

```bash
npm run typecheck
npm run lint
npm run doctor
```

Validate the submission checklist:

```text
docs/SUBMISSION_CHECKLIST.md
```

## EAS builds

Development build:

```bash
npx eas-cli@latest build --profile development --platform android
npx eas-cli@latest build --profile development --platform ios
```

Internal preview:

```bash
npx eas-cli@latest build --profile preview --platform android
npx eas-cli@latest build --profile preview --platform ios
```

Production build:

```bash
npx eas-cli@latest build --profile production --platform all
```

Native credentials, push credentials, and production environment variables
must be configured in the owner's EAS account. They must not be committed.

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

## Current integration boundaries

The mobile app uses the documented Deplo REST contracts for authentication,
repositories, deployments, environment values, monitoring, and account
verification. The following backend capabilities require server support that is
not currently documented by the existing Deplo API:

- Mobile-specific OAuth callback redirection
- Push notification token registration and revocation
- Notification preference synchronization
- Project notification deep-link payload dispatch

The app includes secure device, cache, preference, and deep-link client state,
but it must not claim that remote push delivery or mobile OAuth is complete
until the backend endpoints and callbacks are available.
