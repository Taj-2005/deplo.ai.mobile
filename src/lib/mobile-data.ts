import type { Deployment, LogLine, Project } from "@/types/deplo";

export const projects: Project[] = [
  {
    id: "storefront",
    name: "storefront",
    repository: "taj-2005/storefront",
    branch: "main",
    private: true,
    environment: "Production",
    status: "Live",
    frontendUrl: "https://storefront.vercel.app",
    backendUrl: "https://storefront-api.onrender.com",
  },
  {
    id: "payment-api",
    name: "payment-api",
    repository: "taj-2005/payment-api",
    branch: "main",
    private: true,
    environment: "Production",
    status: "Failed",
    backendUrl: "https://payment-api.onrender.com",
  },
  {
    id: "deplo-docs",
    name: "deplo-docs",
    repository: "deplolabs/deplo-docs",
    branch: "docs",
    private: false,
    environment: "Preview",
    status: "Paused",
  },
];

export const deployments: Deployment[] = [
  {
    id: "dep_storefront",
    projectId: "storefront",
    repositoryId: "storefront",
    projectName: "storefront",
    repository: "taj-2005/storefront",
    branch: "main",
    status: "COMPLETED",
    environment: "Production",
    startedAt: "2026-11-22T03:42:00+05:30",
    durationSeconds: 98,
    commit: "3f8a2c1",
    frontendUrl: "https://storefront.vercel.app",
    backendUrl: "https://storefront-api.onrender.com",
    requiredEnvVars: [],
  },
  {
    id: "dep_api",
    projectId: "payment-api",
    repositoryId: "payment-api",
    projectName: "payment-api",
    repository: "taj-2005/payment-api",
    branch: "main",
    status: "FAILED",
    environment: "Production",
    startedAt: "2026-11-22T03:58:00+05:30",
    durationSeconds: 42,
    commit: "9e21bc4",
    backendUrl: "https://payment-api.onrender.com",
    firstError: "Cannot resolve dependency: @acme/payment-core",
    requiredEnvVars: [],
  },
];

export const deploymentLogs: Record<string, LogLine[]> = {
  dep_api: [
    { id: "1", timestamp: "03:58:02", stage: "Queue", level: "info", message: "Deployment queued for runner-04" },
    { id: "2", timestamp: "03:58:09", stage: "Install", level: "info", message: "Restoring package cache" },
    { id: "3", timestamp: "03:58:31", stage: "Install", level: "warn", message: "Package cache miss; installing fresh dependencies" },
    { id: "4", timestamp: "03:58:38", stage: "Install", level: "error", message: "npm ERR! Cannot resolve dependency: @acme/payment-core" },
    { id: "5", timestamp: "03:58:39", stage: "Build", level: "error", message: "Build stopped because dependency installation failed" },
  ],
};

export function getProject(projectId: string) {
  return projects.find((project) => project.id === projectId);
}

export function getDeployment(deploymentId: string) {
  return deployments.find((deployment) => deployment.id === deploymentId);
}

export function getLatestDeployment(projectId: string) {
  return deployments
    .filter((deployment) => deployment.projectId === projectId)
    .sort((a, b) => b.startedAt.localeCompare(a.startedAt))[0];
}
