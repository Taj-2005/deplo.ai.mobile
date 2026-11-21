import * as LocalAuthentication from "expo-local-authentication";

export interface BiometricStatus {
  compatible: boolean;
  enrolled: boolean;
  types: LocalAuthentication.AuthenticationType[];
}

export async function getBiometricStatus(): Promise<BiometricStatus> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  return { compatible, enrolled, types };
}

export async function authenticateForAppResume(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Unlock Deplo",
    cancelLabel: "Cancel",
    fallbackLabel: "Use device passcode",
    disableDeviceFallback: false,
  });
  return result.success;
}
