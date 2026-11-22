import AsyncStorage from "@react-native-async-storage/async-storage";
import type { CacheEnvelope } from "@/types/cache";

export async function readCache<T>(key: string): Promise<CacheEnvelope<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? JSON.parse(raw) as CacheEnvelope<T> : null;
  } catch {
    return null;
  }
}

export async function writeCache<T>(key: string, value: T): Promise<void> {
  const envelope: CacheEnvelope<T> = {
    value,
    updatedAt: new Date().toISOString(),
  };
  await AsyncStorage.setItem(key, JSON.stringify(envelope));
}

export async function clearCache(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
