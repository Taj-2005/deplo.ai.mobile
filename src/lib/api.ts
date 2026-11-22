import Constants from "expo-constants";
import { getSessionToken } from "@/lib/session";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number | null = null,
  ) {
    super(message);
  }
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

export async function fetchRepositories() {
  return apiFetch<import("@/lib/deplo-api").Repository[]>("/api/v1/repos");
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
