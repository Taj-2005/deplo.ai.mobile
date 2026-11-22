# Deplo Mobile Submission Checklist

## Required platforms

- Android 8.0 or newer
- iOS 15 or newer
- Android physical-device push testing
- iOS physical-device push testing

## Build profiles

`eas.json` provides:

- `development`: native development build
- `preview`: internal Android APK and internal distribution
- `production`: store-ready build with remote version increments

Before the first store build:

1. Create or link the EAS project.
2. Configure Apple credentials and signing.
3. Configure Android signing credentials.
4. Configure FCM/APNs push credentials.
5. Set `EXPO_PUBLIC_API_URL` to the production Deplo API.
6. Confirm OAuth callback and deep-link domains.
7. Verify the mobile backend endpoints listed below.

Do not commit Apple credentials, API keys, signing files, service-account
credentials, or provider secrets.

## Mobile backend contract

The mobile app expects the following server capabilities. Device registration
sends `deviceId`, `platform`, `deviceName`, the Expo token as `pushToken`, and
`pushEnabled`. The server returns that device ID for revocation.

```text
GET  /api/v1/auth/me
GET  /api/v1/auth/github?redirect=deplo://auth/callback
POST /api/v1/deployments/:id/retry
POST /api/v1/deployments
POST /api/v1/mobile/devices
GET  /api/v1/mobile/devices
DELETE /api/v1/mobile/devices/:id
GET  /api/v1/mobile/notifications/preferences
PUT  /api/v1/mobile/notifications/preferences
GET  /api/v1/mobile/notifications
PATCH /api/v1/mobile/notifications/:id/read
GET  /api/v1/mobile/monitoring/:projectId
```

The backend must reject unauthorized retry/redeploy requests and must keep
Vercel, Render, environment, and provider credentials off the device.

## Push notification acceptance

- Foreground notification
- Background notification
- Killed-app notification
- Deployment success deep link
- Deployment failure deep link
- Environment-required deep link
- Project-down deep link
- Project-recovered deep link
- Notification permission denied
- Token refresh
- Device revoke
- Per-project preference override
- Deployment-started notification
- Notification history read-state update

## Authentication acceptance

- GitHub OAuth begins in a secure browser or system flow.
- The app callback stores only the user session.
- The callback handles success and error states.
- Invalid sessions route to sign-in.
- Biometric lock works after resume.
- Device fallback uses passcode or PIN.
- Sign-out revokes push access and clears local device/session state.

## Deployment acceptance

- Logs are readable on a narrow screen.
- Stage filters work.
- First-error copy works.
- Retry requires confirmation.
- Redeploy requires confirmation.
- Duplicate submissions are prevented.
- Server errors are visible.
- Successful actions expose the returned deployment ID.
- Environment values are masked and never cached.

## Offline acceptance

- Cached project/deployment state renders first.
- Cached timestamps are visible.
- Stale data is not labeled live.
- Offline refresh shows recovery guidance.
- Mutation controls require a server connection.
- Reconnect reconciles live state.

## Submission demo

1. Install the app on a physical Android or iOS device.
2. Sign in with GitHub.
3. Show Overview health.
4. Open a project.
5. Open deployment detail.
6. Trigger or select a deployment failure.
7. Receive a push notification.
8. Open the deployment through notification deep linking.
9. Jump to the first error.
10. Confirm a retry.
11. Show the returned active deployment state.
12. Open monitoring and health URLs.
13. Show project alert preferences.
14. Enable biometric lock.
15. Background and resume the app.
16. Sign out and verify device revocation.

Use a staging deployment or test backend for the public demonstration. Avoid
triggering an irreversible real production deployment.
