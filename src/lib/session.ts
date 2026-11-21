import * as SecureStore from "expo-secure-store";

const SESSION_KEY = "deplo.session.token";
const BIOMETRIC_KEY = "deplo.security.biometric";

export async function getSessionToken(): Promise<string | null> {
  return SecureStore.getItemAsync(SESSION_KEY);
}

export async function setSessionToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(SESSION_KEY, token, {
    keychainService: "ai.deplo.mobile.session",
  });
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(SESSION_KEY, {
    keychainService: "ai.deplo.mobile.session",
  });
}

export async function getBiometricPreference(): Promise<boolean> {
  return (await SecureStore.getItemAsync(BIOMETRIC_KEY)) === "enabled";
}

export async function setBiometricPreference(enabled: boolean): Promise<void> {
  if (enabled) {
    await SecureStore.setItemAsync(BIOMETRIC_KEY, "enabled");
  } else {
    await SecureStore.deleteItemAsync(BIOMETRIC_KEY);
  }
}
