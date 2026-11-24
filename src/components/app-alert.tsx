import { createContext, useCallback, useContext, useRef, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";

type AlertKind = "notify" | "confirm";

interface AlertRequest {
  kind: AlertKind;
  title: string;
  description?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
}

export interface ConfirmOptions {
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

interface AppAlertContextValue {
  notify: (title: string, description?: string) => Promise<void>;
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const AppAlertContext = createContext<AppAlertContextValue | null>(null);

/**
 * App-wide replacement for the native Alert.alert — a bottom sheet in the
 * same visual language the deployments screen already used for its destructive
 * confirmations. Mounted once in the root layout so every screen can call
 * useAppAlert() instead of importing react-native's Alert.
 */
export function AppAlertProvider({ children }: { children: React.ReactNode }) {
  const [request, setRequest] = useState<AlertRequest | null>(null);
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const settle = useCallback((result: boolean) => {
    setRequest(null);
    resolveRef.current?.(result);
    resolveRef.current = null;
  }, []);

  const notify = useCallback(
    (title: string, description?: string) =>
      new Promise<void>((resolve) => {
        resolveRef.current = () => resolve();
        setRequest({ kind: "notify", title, description, confirmLabel: "OK", cancelLabel: "", destructive: false });
      }),
    [],
  );

  const confirm = useCallback(
    (options: ConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolveRef.current = resolve;
        setRequest({
          kind: "confirm",
          title: options.title,
          description: options.description,
          confirmLabel: options.confirmLabel ?? "Confirm",
          cancelLabel: options.cancelLabel ?? "Cancel",
          destructive: options.destructive ?? false,
        });
      }),
    [],
  );

  return (
    <AppAlertContext.Provider value={{ notify, confirm }}>
      {children}
      <Modal visible={request !== null} transparent animationType="slide" onRequestClose={() => settle(false)}>
        <Pressable className="flex-1 justify-end bg-black/40" onPress={() => settle(false)}>
          {request ? (
            <Pressable className="border-t border-slate-200 bg-white px-5 pb-8 pt-3" onPress={() => undefined}>
              <View className="mb-5 h-1 w-10 self-center rounded-full bg-slate-300" />
              <Text className="text-[20px] font-bold text-deplo-black">{request.title}</Text>
              {request.description ? (
                <Text className="mt-2 text-[13px] leading-5 text-slate-600">{request.description}</Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                onPress={() => settle(true)}
                className={`mt-6 items-center border px-4 py-4 ${
                  request.destructive ? "border-red-700 bg-red-700" : "border-deplo-black bg-deplo-black"
                }`}
              >
                <Text className="font-mono text-[13px] font-bold text-white">{request.confirmLabel}</Text>
              </Pressable>
              {request.kind === "confirm" ? (
                <Pressable accessibilityRole="button" onPress={() => settle(false)} className="mt-2 items-center py-3">
                  <Text className="font-mono text-[13px] font-bold text-slate-600">{request.cancelLabel}</Text>
                </Pressable>
              ) : null}
            </Pressable>
          ) : null}
        </Pressable>
      </Modal>
    </AppAlertContext.Provider>
  );
}

export function useAppAlert(): AppAlertContextValue {
  const ctx = useContext(AppAlertContext);
  if (!ctx) throw new Error("useAppAlert must be used within AppAlertProvider");
  return ctx;
}
