export interface Repository {
  id: string;
  name: string;
  fullName: string;
  isPrivate: boolean;
  defaultBranch: string;
  updatedAt: string;
  language: string | null;
  description: string | null;
  url: string;
}

export interface Deployment {
  id: string;
  repositoryId: string;
  repositoryName: string;
  repositoryFullName: string;
  status:
    | "PENDING"
    | "ANALYZING"
    | "WAITING_FOR_ENV"
    | "DEPLOYING_BACKEND"
    | "BACKEND_READY"
    | "DEPLOYING_FRONTEND"
    | "COMPLETED"
    | "FAILED"
    | "CANCELLED";
  branch: string;
  frontendUrl: string | null;
  backendUrl: string | null;
  detectedStack: { frontend: string | null; backend: string | null } | null;
  createdAt: string;
  updatedAt: string;
  duration: number | null;
}

export interface DeploymentDetail extends Deployment {
  logs: string[];
  error: string | null;
  envVariables: { key: string; isRequired: boolean }[];
}

export interface ProjectMonitoring {
  project: {
    id: string;
    name: string;
    fullName: string;
  };
  frontend: MonitoringTarget;
  backend: MonitoringTarget;
  server: {
    state: string;
    cpu: { timestamp: string; value: number }[];
    memory: { timestamp: string; value: number }[];
  } | null;
  lastDeployment: {
    id: string;
    at: string;
    branch: string;
  } | null;
  latestAttempt: {
    id: string;
    status: string;
    error: string | null;
    branch: string;
    at: string;
    isNewerThanLive: boolean;
  } | null;
}

export interface MonitoringTarget {
  url: string | null;
  current: {
    ok: boolean;
    httpStatus: number;
    latencyMs: number;
    checkedAt: string;
  } | null;
  uptime24h: number | null;
  series: { t: string; ok: boolean; latencyMs: number | null }[];
}
