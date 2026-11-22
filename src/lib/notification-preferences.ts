import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NotificationCategory, NotificationPreferences } from "@/types/notifications";

const PREFERENCES_KEY = "deplo.notifications.preferences";

const defaultCategories: NotificationPreferences["categories"] = {
  "deployment-success": true,
  "deployment-failed": true,
  "environment-required": true,
  "project-down": true,
  "project-recovered": true,
};

export async function readNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (!raw) {
      return { enabled: true, categories: { ...defaultCategories }, projectOverrides: {} };
    }
    return JSON.parse(raw) as NotificationPreferences;
  } catch {
    return { enabled: true, categories: { ...defaultCategories }, projectOverrides: {} };
  }
}

export async function writeNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<void> {
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export async function setCategoryEnabled(
  category: NotificationCategory,
  enabled: boolean,
): Promise<NotificationPreferences> {
  const preferences = await readNotificationPreferences();
  preferences.categories[category] = enabled;
  await writeNotificationPreferences(preferences);
  return preferences;
}

export async function setProjectCategoryEnabled(
  projectId: string,
  category: NotificationCategory,
  enabled: boolean,
): Promise<NotificationPreferences> {
  const preferences = await readNotificationPreferences();
  const projectPreferences = preferences.projectOverrides[projectId] ?? {};
  projectPreferences[category] = enabled;
  preferences.projectOverrides[projectId] = projectPreferences;
  await writeNotificationPreferences(preferences);
  return preferences;
}
