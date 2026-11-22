import AsyncStorage from "@react-native-async-storage/async-storage";
import type { NotificationCategory, NotificationPreferences } from "@/types/notifications";
import { isDemoMode } from "@/lib/app-config";
import { fetchNotificationPreferences, saveNotificationPreferences } from "@/lib/api";

const PREFERENCES_KEY = "deplo.notifications.preferences";

const defaultCategories: NotificationPreferences["categories"] = {
  "deployment-success": true,
  "deployment-failed": true,
  "environment-required": true,
  "project-down": true,
  "project-recovered": true,
};

const categoryNames = Object.keys(defaultCategories) as NotificationCategory[];

function normalizePreferences(saved: Partial<NotificationPreferences>): NotificationPreferences {
  const categories = { ...defaultCategories };
  for (const category of categoryNames) {
    if (typeof saved.categories?.[category] === "boolean") {
      categories[category] = saved.categories[category];
    }
  }
  const projectOverrides: NotificationPreferences["projectOverrides"] = {};
  for (const [projectId, values] of Object.entries(saved.projectOverrides ?? {})) {
    const normalized: Partial<Record<NotificationCategory, boolean>> = {};
    for (const category of categoryNames) {
      if (typeof values[category] === "boolean") normalized[category] = values[category];
    }
    projectOverrides[projectId] = normalized;
  }
  return { enabled: saved.enabled ?? true, categories, projectOverrides };
}

export async function readNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const raw = await AsyncStorage.getItem(PREFERENCES_KEY);
    if (!raw) {
      return { enabled: true, categories: { ...defaultCategories }, projectOverrides: {} };
    }
    const saved = JSON.parse(raw) as Partial<NotificationPreferences>;
    return normalizePreferences(saved);
  } catch {
    return { enabled: true, categories: { ...defaultCategories }, projectOverrides: {} };
  }
}

export async function loadNotificationPreferences(): Promise<NotificationPreferences> {
  if (isDemoMode) return readNotificationPreferences();
  try {
    const remote = await fetchNotificationPreferences();
    const normalized = normalizePreferences(remote);
    await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(normalized));
    return normalized;
  } catch {
    return readNotificationPreferences();
  }
}

export async function writeNotificationPreferences(
  preferences: NotificationPreferences,
): Promise<void> {
  if (!isDemoMode) await saveNotificationPreferences(preferences);
  await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export async function setCategoryEnabled(
  category: NotificationCategory,
  enabled: boolean,
): Promise<NotificationPreferences> {
  const preferences = await loadNotificationPreferences();
  preferences.categories[category] = enabled;
  await writeNotificationPreferences(preferences);
  return preferences;
}

export async function setProjectCategoryEnabled(
  projectId: string,
  category: NotificationCategory,
  enabled: boolean,
): Promise<NotificationPreferences> {
  const preferences = await loadNotificationPreferences();
  const projectPreferences = preferences.projectOverrides[projectId] ?? {};
  projectPreferences[category] = enabled;
  preferences.projectOverrides[projectId] = projectPreferences;
  await writeNotificationPreferences(preferences);
  return preferences;
}
