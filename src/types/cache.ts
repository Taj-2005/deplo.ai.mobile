export interface CacheEnvelope<T> {
  value: T;
  updatedAt: string;
}

export type UnavailableReason = "offline" | "unauthorized" | "error" | null;

export interface DataState<T> {
  data: T | null;
  updatedAt: string | null;
  loading: boolean;
  stale: boolean;
  unavailable: boolean;
  error: string | null;
  reason: UnavailableReason;
}
