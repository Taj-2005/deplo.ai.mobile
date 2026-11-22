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

export async function retryDeployment(deploymentId: string): Promise<{ deploymentId: string }> {
  void deploymentId;
  throw new ApiError(
    "The documented API does not expose a dedicated retry endpoint. Start a new deployment instead.",
    null,
  );
}

export async function redeployProject(
  projectId: string,
  commit: string,
): Promise<{ deploymentId: string }> {
  return apiFetch<{ deploymentId: string }>(
    `/api/v1/deployments`,
    {
      method: "POST",
      body: JSON.stringify({ projectId, commit }),
    },
  );
}

export async function revokeMobileDevice(deviceId: string): Promise<void> {
  await apiFetch<void>(
    `/api/v1/mobile/devices/${encodeURIComponent(deviceId)}`,
    { method: "DELETE" },
  );
}
