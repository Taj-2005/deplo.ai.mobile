import "../../global.css";

import { useEffect, useRef, useState } from "react";
import { router, Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getNotificationRoute, type NotificationRouteData } from "@/lib/notification-routing";
import { configureNotifications } from "@/lib/notifications";
import { clearSession, getSessionToken } from "@/lib/session";
import { verifySession } from "@/lib/api";
import { subscribeToAppResume } from "@/lib/auth-lifecycle";
import { Pressable, Text, View } from "react-native";
import { authenticateForAppResume } from "@/lib/biometrics";
import { isDemoMode } from "@/lib/app-config";

export default function RootLayout() {
  const responseSubscription = useRef<Notifications.EventSubscription | null>(null);
  const [sessionChecked, setSessionChecked] = useState(isDemoMode);
  const [biometricLocked, setBiometricLocked] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void getSessionToken().then((token) => {
      if (cancelled) return;
      if (isDemoMode) return;
      if (!token) {
        setSessionChecked(true);
        router.replace("/auth/sign-in");
        return;
      }
      void verifySession()
        .then(() => setSessionChecked(true))
        .catch(async (error) => {
          if (typeof error === "object" && error && "status" in error &&
              (error.status === 401 || error.status === 403)) {
            await clearSession();
            if (!cancelled) router.replace("/auth/sign-in");
          }
          if (!cancelled) setSessionChecked(true);
        });
    });

    void configureNotifications();
    responseSubscription.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data as NotificationRouteData;
        router.push(getNotificationRoute(data) as never);
      });

    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (!response) return;
      const data = response.notification.request.content.data as NotificationRouteData;
      router.push(getNotificationRoute(data) as never);
    });

    const unsubscribeResume = subscribeToAppResume(() => {
      setBiometricLocked(true);
    });

    return () => {
      cancelled = true;
      responseSubscription.current?.remove();
      unsubscribeResume();
    };
  }, []);

  if (!sessionChecked) {
    return (
      <SafeAreaProvider>
        <View className="flex-1 items-center justify-center bg-white">
          <Text className="font-mono text-[11px] font-bold uppercase tracking-widest text-slate-500">
            Loading Deplo
          </Text>
        </View>
      </SafeAreaProvider>
    );
  }

  if (biometricLocked) {
    const unlock = async () => {
      if (await authenticateForAppResume()) setBiometricLocked(false);
    };
    return (
      <SafeAreaProvider>
        <View className="flex-1 items-center justify-center bg-white px-8">
          <Text className="text-[20px] font-bold text-deplo-black">Deplo is locked</Text>
          <Text className="mt-2 text-center text-[13px] leading-5 text-slate-500">
            Unlock this device before returning to deployment controls.
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => void unlock()}
            className="mt-6 border border-deplo-black bg-deplo-black px-6 py-3.5"
          >
            <Text className="font-mono text-[12px] font-bold text-white">Unlock Deplo</Text>
          </Pressable>
        </View>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#FFFFFF" },
        }}
      />
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}
