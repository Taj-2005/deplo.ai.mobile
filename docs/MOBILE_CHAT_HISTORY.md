# Deplo Mobile — prompt and implementation record

This document records the mobile app work requested through Copilot and Codex, along with the relevant implementation checkpoints. It covers the React Native app in this repository and the separately maintained backend contract.

## Project context and product direction (Copilot)

### Understand Deplo before designing the mobile client

> Study the Deplo.ai product and its existing web and desktop applications before changing the mobile experience. Inspect the repositories, source code, screenshots, product flows, UI patterns, typography, colors, spacing, terminology, and current deployment workflow. Explain the product problem Deplo solves, its users, core concepts, and the relationship among projects, deployments, environments, logs, monitoring, and notifications. Use this evidence to define a mobile experience that feels like Deplo, adapts its information hierarchy to phones, and does not invent product behavior unsupported by the existing applications or backend.

## Mobile foundation and delivery (Copilot)

### Establish the React Native app

> In the mobile repository, create a production-oriented React Native application using the official Expo workflow and `npx create-expo-app`, TypeScript, Expo Router, and NativeWind. Keep the app self-contained in this repository, align its naming and visual system with Deplo, and add the development scripts and setup documentation needed for another engineer to run it. Make meaningful, subject-specific commits directly on `main`, keep commit subjects concise, push to `https://github.com/Taj-2005/deplo.ai.mobile`, and report the resulting commits and remote state. Do not create placeholder commits or claim a push unless the remote confirms it.

### Convert the project submission into an implementation plan

> Read `APP DEV Project Submission.md` end to end. Map every requirement to the mobile app's screens, user flows, platform behavior, technical components, and acceptance criteria. Identify dependencies and risks, group the work into ordered phases, and distinguish requirements that need backend support from work that belongs in the mobile client. Present a concrete implementation plan before coding, with traceable coverage so no submission requirement is silently dropped.

### Complete the mobile implementation

> Implement the complete Deplo mobile client from the approved submission and project context. Build polished, accessible Android and iOS screens for authentication, project/deployment overview, deployment details, logs, environment-variable requirements, monitoring status, notification preferences, and notification history. Use the existing Deplo design language, real API data, loading/empty/error/offline states, secure session storage, platform-safe navigation, and Expo push-token registration. Do not stop at a scaffold or wait for a native build to finish before completing the implementation; keep the code runnable and document any item that depends on backend support or physical-device verification.

### Keep the mobile task within its repository boundary

> Complete the mobile frontend and its API client in the mobile repository. Do not modify the backend repository as part of this work. When an endpoint, payload, authentication behavior, or push capability is missing, document the exact contract needed and produce a separate backend implementation prompt that a backend engineer can apply in the backend repository.

## Backend contract handoff (Copilot)

### Implement mobile support in the backend repository

> In the Deplo backend repository, inspect the existing authentication, project, deployment, monitoring, database, and notification architecture, then implement the mobile API contract without breaking the web or CLI clients. Add GitHub OAuth support that returns to `deplo://auth/callback`, issue mobile JWTs with a seven-day lifetime, and expose `/api/v1/auth/me`. Add authenticated mobile device registration, listing, and revocation using Expo push tokens; persist notification preferences with per-project overrides; and provide notification history with read-state updates. Dispatch push notifications for deployment start, completion and failure, environment-variable pauses, and project down/recovered events. Payloads must include a route and `projectId`, plus `deploymentId` when relevant. Route delivery through Expo to FCM/APNs, retry transient failures, and remove invalid tokens. Encrypt environment values and push tokens at rest. Deployment details may expose environment-variable keys and required flags, never values. Require mobile JWTs for device and preference management; CLI tokens must not access those operations. Add migrations, validation, authorization, tests, and documentation consistent with the repository's established patterns.

## Mobile app implementation and integration (Codex)

### Resume the mobile app from repository evidence

> Inspect the mobile repository, its project guidance, the submission requirements, and the current implementation before editing. Complete the remaining mobile app work in this repository, preserving its existing Expo and NativeWind patterns. Treat the backend as a separately maintained project: integrate only against confirmed routes and payloads, identify any contract gaps precisely, and avoid exposing credentials, environment values, or push tokens in logs or documentation. Keep changes focused and report implemented behavior separately from work that still requires device or production verification.

### Make overview status reflect actual deployments

> Replace static or misleading project-health summaries with values derived from the deployment data already returned by the API. Define which deployment states count as active, successful, or failed based on the backend contract; handle projects with no deployments, partial data, and request failures without implying that a project is healthy when its status is unknown. Preserve the existing overview design and provide explicit loading, empty, and error behavior.

### Integrate mobile authentication and notifications with the backend

> Connect the app to the mobile backend contract on `feat/live-apps-feedback` (commit `1685c87`). Follow its GitHub OAuth callback scheme `deplo://auth/callback` and seven-day mobile JWT behavior. Store the session in platform-secure storage. Register Expo push tokens with the device identity, platform, device name, and push-enabled state; load and revoke device registrations by device ID. Load and update global notification preferences and per-project overrides, retrieve notification history, and mark items read. Handle notification taps using the supplied route, `projectId`, and optional `deploymentId`. Match the backend's actual request and response schemas, surface API failures clearly, and never log tokens or secrets.

### Publish Android APKs from GitHub Actions

> Configure this repository to build a release APK on every push to every branch and attach the APK to a GitHub Release. Use a normal release on `main` and a prerelease for other branches, with unique tags that identify the branch and commit. Build from the checked-in Expo app using the local Android Gradle release task, assign a unique version code from the GitHub Actions run number, and grant only the GitHub permission required to create releases. Avoid requiring EAS credentials if the build is performed locally in Actions. Document that the artifact is a sideloadable APK and do not imply Play Store signing or publication unless configured and verified.

### Use the local Gradle release build in CI

> Build the Android artifact in GitHub Actions with the repository's Expo native project: install dependencies with the lockfile, run `npx expo prebuild --platform android --no-install`, then run `./gradlew --no-daemon assembleRelease` from `android/`. Copy the generated release APK to a stable artifact name before uploading it to the branch-specific GitHub Release. Set the Android `versionCode` from `GITHUB_RUN_NUMBER` so consecutive pushes remain installable as upgrades. Keep the workflow reproducible and fail clearly when the APK is missing.

### Resolve the Android SDK setup failure

> Diagnose the Actions log where `android-actions/setup-android@v3` invokes `sdkmanager tools` and exits because the obsolete `tools` package cannot be found. Inspect the runner's preinstalled Android SDK and replace the failing setup step with a supported configuration that uses the installed SDK manager, accepts licenses non-interactively, and exports the correct `ANDROID_HOME`/`ANDROID_SDK_ROOT` for Gradle. Preserve the release build and release-upload behavior, then verify the workflow YAML and push the fix.

### Keep the delivery history reviewable

> Keep the mobile feature and CI work on `main` as focused commits with concise subject-only messages. Add this prompt and implementation record on a separate `chat-history/mobile-chat-history` branch, link the branch and report from the HTML verification page, and push that branch without rewriting the feature history. Confirm the commit hashes and remote branch after pushing.

## Implementation checkpoints

| Area | Evidence | Status |
|---|---|---|
| Expo mobile app | Repository is an Expo/React Native project with NativeWind and Expo Router. | Implemented |
| Deployment overview | `95ded30` derives overview status from deployment data. | Implemented |
| Backend integration | `70b4126` syncs push devices and notification history. | Implemented against the mobile API contract |
| Android release workflow | `88238f6` adds local Gradle APK builds; `3b01ea9` fixes SDK setup by using the runner's installed Android SDK. | Pushed to `main`; run status not confirmed in this record |
| Device notifications | Expo token registration and notification navigation are implemented in the client. | Physical-device delivery remains unverified |
| Backend | Separate repository branch `feat/live-apps-feedback`, commit `1685c87`. | Backend-owned; production deployment not verified |

## Source notes

The Copilot prompts above are based on the supplied chat summary and attached submission/backend handoff documents. The Codex prompts summarize the mobile implementation and CI work in the project conversation. The report distinguishes repository evidence from checks that still require a real GitHub Actions run, physical-device testing, or a production backend deployment.
