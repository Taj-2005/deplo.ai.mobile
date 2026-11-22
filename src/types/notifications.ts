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
  deviceId?: string;
  pushToken: string | null;
  platform: "ios" | "android" | "web";
  deviceName: string;
  isPhysicalDevice: boolean;
}

export interface MobileNotification {
  id: string;
  title: string;
  body: string;
  category: NotificationCategory | string;
  createdAt: string;
  isRead: boolean;
  route?: string;
  projectId?: string;
  deploymentId?: string;
}
