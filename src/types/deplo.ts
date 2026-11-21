export type DeploymentStatus =
  | "QUEUED"
  | "BUILDING"
  | "DEPLOYING"
  | "COMPLETED"
  | "FAILED"
  | "CANCELED";

export interface Project {
  id: string;
  name: string;
  repository: string;
  branch: string;
  private: boolean;
  environment: "Production" | "Preview";
  status: "Live" | "Failed" | "Paused" | "Preview";
  frontendUrl?: string;
  backendUrl?: string;
}

export interface Deployment {
  id: string;
  projectId: string;
  projectName: string;
  repository: string;
  branch: string;
  status: DeploymentStatus;
  environment: "Production" | "Preview";
  startedAt: string;
  durationSeconds?: number;
  commit: string;
  frontendUrl?: string;
  backendUrl?: string;
  firstError?: string;
  requiredEnvVars: string[];
}

export interface LogLine {
  id: string;
  timestamp: string;
  stage: "Queue" | "Install" | "Build" | "Deploy";
  level: "info" | "warn" | "error";
  message: string;
}
