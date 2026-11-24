import { useCallback, useEffect, useRef, useState } from "react";
import type { DataState } from "@/types/cache";
import { readCache, writeCache } from "@/lib/cache";
import { getConnectivity } from "@/lib/connectivity";
import { ApiError } from "@/lib/api";

export function useCachedData<T>(
  key: string,
  fallback: T,
  loader: () => Promise<T>,
) {
  const optionsRef = useRef({ fallback, loader });
  useEffect(() => {
    optionsRef.current = { fallback, loader };
  });
  const [state, setState] = useState<DataState<T>>({
    data: fallback,
    updatedAt: null,
    loading: true,
    stale: true,
    unavailable: false,
    error: null,
    reason: null,
  });

  const refresh = useCallback(async () => {
    const { fallback: currentFallback, loader: currentLoader } = optionsRef.current;
    setState((current) => ({ ...current, loading: true, error: null }));

    const [cached, connectivity] = await Promise.all([
      readCache<T>(key),
      getConnectivity(),
    ]);

    if (cached) {
      setState({
        data: cached.value,
        updatedAt: cached.updatedAt,
        loading: true,
        stale: true,
        unavailable: false,
        error: null,
        reason: null,
      });
    }

    if (!connectivity.connected || connectivity.internetReachable === false) {
      setState({
        data: cached?.value ?? currentFallback,
        updatedAt: cached?.updatedAt ?? null,
        loading: false,
        stale: true,
        unavailable: true,
        error: "Offline",
        reason: "offline",
      });
      return;
    }

    try {
      const value = await currentLoader();
      await writeCache(key, value);
      setState({
        data: value,
        updatedAt: new Date().toISOString(),
        loading: false,
        stale: false,
        unavailable: false,
        error: null,
        reason: null,
      });
    } catch (error) {
      const isAuthError = error instanceof ApiError && error.status === 401;
      setState({
        data: cached?.value ?? currentFallback,
        updatedAt: cached?.updatedAt ?? null,
        loading: false,
        stale: true,
        unavailable: true,
        error: isAuthError
          ? "Sign in again to continue."
          : error instanceof Error
            ? error.message
            : "Unable to reach Deplo.",
        reason: isAuthError ? "unauthorized" : "error",
      });
    }
  }, [key]);

  useEffect(() => {
    const timer = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(timer);
  }, [refresh]);

  return { ...state, refresh };
}
