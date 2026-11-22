export interface CacheEnvelope<T> {
  value: T;
  updatedAt: string;
}

export interface DataState<T> {
  data: T | null;
  updatedAt: string | null;
  loading: boolean;
  stale: boolean;
  unavailable: boolean;
  error: string | null;
}
