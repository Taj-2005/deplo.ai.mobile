import Constants from "expo-constants";
import { getSessionToken } from "@/lib/session";
import type { MobileNotification, NotificationPreferences } from "@/types/notifications";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null = null,
  ) {
    super(message);
  }
}

export interface MobileDevice {
  deviceId: string;
  deviceName: string;
  platform: string;
  pushEnabled: boolean;
  invalidToken: boolean;
  updatedAt: string;
}

export interface IntegrationStatus {
  provider: "VERCEL" | "RENDER";
  connected: boolean;
  accountName: string | null;
  teamName: string | null;
  teamId: string | null;
  connectedAt: string | null;
}

function getApiOrigin(): string {
  const configured = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured;

  const extraOrigin = Constants.expoConfig?.extra?.apiUrl;
  return typeof extraOrigin === "string"
    ? extraOrigin.replace(/\/$/, "")
    : "https://www.deplo.in";
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await getSessionToken();
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response: Response;
  try {
    response = await fetch(`${getApiOrigin()}${path}`, {
      ...init,
      headers,
    });
  } catch {
    throw new ApiError("The Deplo server is unreachable.", null);
  }

  if (!response.ok) {
    let message = `Request failed with status ${response.status}.`;
    try {
      const payload = await response.json() as { error?: { message?: string }; message?: string };
      message = payload.error?.message || payload.message || message;
    } catch {
      // Keep the stable HTTP status message when the response is not JSON.
    }
    throw new ApiError(message, response.status);
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function redeployRepository(
  repositoryId: string,
  envVars?: { key: string; value: string }[],
): Promise<{ deploymentId: string; status: string }> {
  return apiFetch<{ deploymentId: string; status: string }>(
    `/api/v1/deployments`,
    {
      method: "POST",
      body: JSON.stringify({
        repositoryId,
        ...(envVars?.length ? { envVars } : {}),
      }),
    },
  );
}

export async function revokeMobileDevice(deviceId: string): Promise<void> {
  await apiFetch<void>(
    `/api/v1/mobile/devices/${encodeURIComponent(deviceId)}`,
    { method: "DELETE" },
  );
}

export async function registerMobileDevice(input: {
  deviceId: string;
  deviceName: string;
  platform: "ios" | "android";
  pushToken: string;
  pushEnabled: boolean;
}) {
  return apiFetch<{ deviceId: string; registered: boolean }>("/api/v1/mobile/devices", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function fetchMobileDevices() {
  const result = await apiFetch<MobileDevice[] | { devices: MobileDevice[] }>(
    "/api/v1/mobile/devices",
  );
  return Array.isArray(result) ? result : result.devices;
}

export async function fetchNotificationPreferences() {
  const result = await apiFetch<NotificationPreferences | { preferences: NotificationPreferences }>(
    "/api/v1/mobile/notifications/preferences",
  );
  return "preferences" in result ? result.preferences : result;
}

export async function saveNotificationPreferences(preferences: NotificationPreferences) {
  return apiFetch<NotificationPreferences>("/api/v1/mobile/notifications/preferences", {
    method: "PUT",
    body: JSON.stringify(preferences),
  });
}

export async function fetchMobileNotifications() {
  const result = await apiFetch<Array<Record<string, unknown>> | { notifications: Array<Record<string, unknown>> }>(
    "/api/v1/mobile/notifications",
  );
  const records = Array.isArray(result) ? result : result.notifications;
  return records.map((record): MobileNotification => {
    const data = typeof record.data === "object" && record.data !== null
      ? record.data as Record<string, unknown>
      : {};
    const isRead = typeof record.isRead === "boolean"
      ? record.isRead
      : typeof record.read === "boolean"
        ? record.read
        : Boolean(record.readAt ?? record.read_at);
    return {
      id: String(record.id ?? record.notificationId ?? ""),
      title: String(record.title ?? record.heading ?? "Deplo notification"),
      body: String(record.body ?? record.message ?? record.description ?? ""),
      category: String(record.category ?? record.type ?? "deployment"),
      createdAt: String(record.createdAt ?? record.created_at ?? new Date().toISOString()),
      isRead,
      route: String(record.route ?? data.route ?? ""),
      projectId: String(record.projectId ?? data.projectId ?? "") || undefined,
      deploymentId: String(record.deploymentId ?? data.deploymentId ?? "") || undefined,
    };
  }).filter((record) => record.id.length > 0);
}

export async function markMobileNotificationRead(notificationId: string) {
  await apiFetch<void>(
    `/api/v1/mobile/notifications/${encodeURIComponent(notificationId)}/read`,
    { method: "PATCH" },
  );
}

export async function fetchRepositories() {
  return apiFetch<import("@/lib/deplo-api").Repository[]>("/api/v1/repos");
}

export interface RepositoryAnalysis {
  stack: {
    frontend: string | null;
    backend: string | null;
    frontendPath: string;
    backendPath: string;
    buildCommand: string | null;
    packageManager: string;
  };
  envVars: Array<{ key: string; value: string; isRequired: boolean; source: string }>;
  defaultBranch: string;
}

export async function analyzeRepository(repositoryId: string) {
  return apiFetch<RepositoryAnalysis>(
    `/api/v1/repos/${encodeURIComponent(repositoryId)}/analyze`,
  );
}

export async function syncRepositories() {
  return apiFetch<{ synced: number }>("/api/v1/repos/sync", { method: "POST" });
}

export async function fetchDeployments() {
  return apiFetch<import("@/lib/deplo-api").Deployment[]>("/api/v1/deployments");
}

export async function fetchDeployment(deploymentId: string) {
  return apiFetch<import("@/lib/deplo-api").DeploymentDetail>(
    `/api/v1/deployments/${encodeURIComponent(deploymentId)}`,
  );
}

export async function provideDeploymentEnv(
  deploymentId: string,
  envVars: { key: string; value: string }[],
) {
  return apiFetch<{ deploymentId: string; status: string }>(
    `/api/v1/deployments/${encodeURIComponent(deploymentId)}/env`,
    { method: "POST", body: JSON.stringify({ envVars }) },
  );
}

export async function cancelDeployment(deploymentId: string) {
  return apiFetch<{ deploymentId: string; status: string }>(
    `/api/v1/deployments/${encodeURIComponent(deploymentId)}`,
    { method: "DELETE" },
  );
}

export async function fetchProjectMonitoring(repositoryId: string) {
  return apiFetch<import("@/lib/deplo-api").ProjectMonitoring>(
    `/api/v1/projects/${encodeURIComponent(repositoryId)}/monitoring`,
  );
}

export async function verifySession() {
  return apiFetch<{
    userId: string;
    email: string;
    name: string;
    githubLogin: string;
    avatarUrl: string | null;
  }>("/api/v1/auth/me");
}

export async function fetchIntegrations() {
  const result = await apiFetch<{ integrations: IntegrationStatus[] }>("/api/v1/integrations");
  return result.integrations;
}

export async function getVercelInstallUrl() {
  const result = await apiFetch<{ url: string }>(
    "/api/v1/integrations/vercel/install-url?returnTo=onboarding",
  );
  return result.url;
}

export async function connectRender(apiKey: string) {
  return apiFetch<{ connected: boolean; accountName: string | null; teamName: string | null }>(
    "/api/v1/integrations/render",
    { method: "POST", body: JSON.stringify({ apiKey }) },
  );
}
