import type { NotificationCategory } from "@/types/notifications";

export interface NotificationRouteData {
  route?: "deployment" | "project" | "monitoring" | "overview";
  deploymentId?: string;
  projectId?: string;
  category?: NotificationCategory;
}

export function getNotificationRoute(data: NotificationRouteData): string {
  if (data.route === "deployment" && data.deploymentId) {
    return `/deployments/${data.deploymentId}`;
  }
  if (data.route === "project" && data.projectId) {
    return `/project/${data.projectId}`;
  }
  if (data.route === "monitoring" && data.projectId) {
    return `/monitoring/${data.projectId}`;
  }
  return "/(tabs)";
}
