export type NotificationCategory =
  | "deployment-success"
  | "deployment-failed"
  | "environment-required"
  | "project-down"
  | "project-recovered";

export interface NotificationPreferences {
  enabled: boolean;
  categories: Record<NotificationCategory, boolean>;
  projectOverrides: Record<string, Partial<Record<NotificationCategory, boolean>>>;
}

export interface DeviceRegistration {
  pushToken: string | null;
  platform: "ios" | "android" | "web";
  deviceName: string;
  isPhysicalDevice: boolean;
}
