import { AppState, type AppStateStatus } from "react-native";
import { authenticateForAppResume } from "@/lib/biometrics";
import { getBiometricPreference } from "@/lib/session";

export type AuthLifecycleListener = (status: AppStateStatus) => void;

export function subscribeToAppResume(onUnlockRequired: () => void): () => void {
  let previousState: AppStateStatus =
    (AppState.currentState as AppStateStatus | null) ?? "inactive";

  const subscription = AppState.addEventListener("change", (nextState) => {
    if (
      (previousState === "background" || previousState === "inactive") &&
      nextState === "active"
    ) {
      void getBiometricPreference().then(async (enabled) => {
        if (!enabled) return;
        const unlocked = await authenticateForAppResume();
        if (!unlocked) onUnlockRequired();
      });
    }
    previousState = nextState;
  });

  return () => subscription.remove();
}
