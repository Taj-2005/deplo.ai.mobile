import { Platform } from "react-native";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";
import { AndroidImportance } from "expo-notifications/build/NotificationChannelManager.types";
import type { DeviceRegistration, NotificationCategory, NotificationPreferences } from "@/types/notifications";
import { getOrCreateDeviceId, saveDeviceRegistrationId } from "@/lib/device";
import { registerMobileDevice } from "@/lib/api";
import { isDemoMode } from "@/lib/app-config";
import { getSessionToken } from "@/lib/session";

const DEVICE_PUSH_TOKEN_KEY = "deplo.notifications.push-token";

export async function clearPushRegistration(): Promise<void> {
  await SecureStore.deleteItemAsync(DEVICE_PUSH_TOKEN_KEY, {
    keychainService: "ai.deplo.mobile.notifications",
  });
}

const DEFAULT_CATEGORIES: NotificationPreferences["categories"] = {
  "deployment-success": true,
  "deployment-failed": true,
  "environment-required": true,
  "project-down": true,
  "project-recovered": true,
};

export async function configureNotifications(): Promise<void> {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("deplo-deployments", {
      name: "Deployments",
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#00D2FF",
    });

    await Notifications.setNotificationChannelAsync("deplo-health", {
      name: "Project health",
      importance: AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#16A34A",
    });
  }
}

export async function registerDeviceForPush(): Promise<DeviceRegistration> {
  await configureNotifications();

  const existingPermission = await Notifications.getPermissionsAsync();
  let permission = existingPermission.status;
  if (permission !== "granted") {
    const requestedPermission = await Notifications.requestPermissionsAsync();
    permission = requestedPermission.status;
  }

  const platform = Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web";
  const deviceName = Device.deviceName || Device.modelName || "Deplo device";

  if (permission !== "granted" || !Device.isDevice) {
    return { pushToken: null, platform, deviceName, isPhysicalDevice: Device.isDevice };
  }

  const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
  const pushToken = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
  return syncPushToken(pushToken, platform, deviceName);
}

async function syncPushToken(
  pushToken: string,
  platform: DeviceRegistration["platform"],
  deviceName: string,
): Promise<DeviceRegistration> {
  const deviceId = await getOrCreateDeviceId();
  if (!isDemoMode && (platform === "ios" || platform === "android")) {
    const registered = await registerMobileDevice({
      deviceId,
      deviceName,
      platform,
      pushToken,
      pushEnabled: true,
    });
    const registrationId = registered?.deviceId;
    if (registrationId) await saveDeviceRegistrationId(registrationId);
  }
  await SecureStore.setItemAsync(DEVICE_PUSH_TOKEN_KEY, pushToken, {
    keychainService: "ai.deplo.mobile.notifications",
  });

  return { deviceId, pushToken, platform, deviceName, isPhysicalDevice: true };
}

export function subscribeToPushTokenRefresh(): Notifications.EventSubscription {
  return Notifications.addPushTokenListener(() => {
    void (async () => {
      if (isDemoMode || !(await getSessionToken()) || !Device.isDevice) return;
      const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      const pushToken = (await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined)).data;
      const platform = Platform.OS === "ios" || Platform.OS === "android" ? Platform.OS : "web";
      await syncPushToken(pushToken, platform, Device.deviceName || Device.modelName || "Deplo device");
    })().catch(() => undefined);
  });
}

export function getDefaultNotificationPreferences(): NotificationPreferences {
  return {
    enabled: true,
    categories: { ...DEFAULT_CATEGORIES },
    projectOverrides: {},
  };
}

export function getCategoryChannel(category: NotificationCategory): string {
  return category === "project-down" || category === "project-recovered"
    ? "deplo-health"
    : "deplo-deployments";
}
