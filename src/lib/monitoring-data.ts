import type { MonitoringSnapshot } from "@/types/monitoring";

export const monitoringSnapshots: Record<string, MonitoringSnapshot> = {
  storefront: {
    projectId: "storefront",
    frontend: {
      url: "https://storefront.vercel.app",
      health: "up",
      latencyMs: 142,
      lastCheckedAt: "2026-11-22T18:52:00+05:30",
    },
    backend: {
      url: "https://storefront-api.onrender.com",
      health: "up",
      latencyMs: 186,
      lastCheckedAt: "2026-11-22T18:52:00+05:30",
    },
    uptime24h: 99.98,
    downtimeEvents24h: 0,
    updatedAt: "2026-11-22T18:52:10+05:30",
  },
  "payment-api": {
    projectId: "payment-api",
    frontend: {
      url: "",
      health: "unknown",
      latencyMs: null,
      lastCheckedAt: "2026-11-22T18:52:00+05:30",
    },
    backend: {
      url: "https://payment-api.onrender.com",
      health: "down",
      latencyMs: null,
      lastCheckedAt: "2026-11-22T18:52:00+05:30",
    },
    uptime24h: 97.41,
    downtimeEvents24h: 3,
    updatedAt: "2026-11-22T18:52:10+05:30",
  },
};
