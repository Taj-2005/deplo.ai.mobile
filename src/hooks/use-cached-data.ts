import { useCallback, useEffect, useRef, useState } from "react";
import type { DataState } from "@/types/cache";
import { readCache, writeCache } from "@/lib/cache";
import { getConnectivity } from "@/lib/connectivity";

export function useCachedData<T>(
  key: string,
  fallback: T,
  loader: () => Promise<T>,
) {
  const optionsRef = useRef({ fallback, loader });
  optionsRef.current = { fallback, loader };
  const [state, setState] = useState<DataState<T>>({
    data: fallback,
    updatedAt: null,
    loading: true,
    stale: true,
    unavailable: false,
    error: null,
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
      });
    } catch (error) {
      setState({
        data: cached?.value ?? currentFallback,
        updatedAt: cached?.updatedAt ?? null,
        loading: false,
        stale: true,
        unavailable: true,
        error: error instanceof Error ? error.message : "Unable to reach Deplo.",
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
