export type TargetHealth = "up" | "down" | "unknown";

export interface HealthTarget {
  url: string;
  health: TargetHealth;
  latencyMs: number | null;
  lastCheckedAt: string;
}

export interface MonitoringSnapshot {
  projectId: string;
  frontend: HealthTarget;
  backend: HealthTarget;
  uptime24h: number;
  downtimeEvents24h: number;
  updatedAt: string;
}
