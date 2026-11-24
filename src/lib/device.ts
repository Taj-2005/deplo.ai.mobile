import * as SecureStore from "expo-secure-store";
import * as Device from "expo-device";

const DEVICE_ID_KEY = "deplo.mobile.device-id";
const DEVICE_REGISTRATION_ID_KEY = "deplo.mobile.device-registration-id";

export async function getOrCreateDeviceId(): Promise<string> {
  const existing = await SecureStore.getItemAsync(DEVICE_ID_KEY, {
    keychainService: "ai.deplo.mobile.device",
  });
  if (existing) return existing;

  const random = Array.from({ length: 16 }, () =>
    Math.floor(Math.random() * 16).toString(16),
  ).join("");
  const deviceId = `mobile_${Device.modelId || "device"}_${random}`;
  await SecureStore.setItemAsync(DEVICE_ID_KEY, deviceId, {
    keychainService: "ai.deplo.mobile.device",
  });
  return deviceId;
}

export async function clearDeviceIdentity(): Promise<void> {
  await SecureStore.deleteItemAsync(DEVICE_ID_KEY, {
    keychainService: "ai.deplo.mobile.device",
  });
  await SecureStore.deleteItemAsync(DEVICE_REGISTRATION_ID_KEY, {
    keychainService: "ai.deplo.mobile.device",
  });
}

export async function saveDeviceRegistrationId(registrationId: string): Promise<void> {
  await SecureStore.setItemAsync(DEVICE_REGISTRATION_ID_KEY, registrationId, {
    keychainService: "ai.deplo.mobile.device",
  });
}

export async function getDeviceRegistrationId(): Promise<string | null> {
  return SecureStore.getItemAsync(DEVICE_REGISTRATION_ID_KEY, {
    keychainService: "ai.deplo.mobile.device",
  });
}
