export interface NotificationRouteData {
  route?: string;
  deploymentId?: string;
  projectId?: string;
  category?: string;
}

export function getNotificationRoute(data: NotificationRouteData): string {
  if (data.route?.startsWith("/")) return safeInternalRoute(data.route);
  if (data.route?.startsWith("deplo://")) {
    try {
      const url = new URL(data.route);
      const path = `/${url.host}${url.pathname}`.replace(/\/{2,}/g, "/");
      return safeInternalRoute(path);
    } catch {
      // Fall through to the identifier-based route fields.
    }
  }
  if (data.route === "deployment" && data.deploymentId) {
    return `/deployments/${encodeURIComponent(data.deploymentId)}`;
  }
  if (data.route === "environment" && data.deploymentId) {
    return `/deployment-env/${encodeURIComponent(data.deploymentId)}`;
  }
  if (data.route === "project" && data.projectId) {
    return `/project/${encodeURIComponent(data.projectId)}`;
  }
  if (data.route === "monitoring" && data.projectId) {
    return `/monitoring/${encodeURIComponent(data.projectId)}`;
  }
  return "/(tabs)";
}

function safeInternalRoute(route: string): string {
  const path = route.split(/[?#]/, 1)[0];
  if (/^\/deployments\/[^/]+$/.test(path)) return path;
  if (/^\/deployment-env\/[^/]+$/.test(path)) return path;
  if (/^\/project\/[^/]+$/.test(path)) return path;
  if (/^\/monitoring\/[^/]+$/.test(path)) return path;
  if (path === "/notifications" || path === "/overview" || path === "/(tabs)") {
    return path === "/overview" ? "/(tabs)" : path;
  }
  return "/(tabs)";
}
