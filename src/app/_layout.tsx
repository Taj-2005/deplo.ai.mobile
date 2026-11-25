import "../../global.css";

import { useEffect, useRef, useState } from "react";
import { router, Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getNotificationRoute, type NotificationRouteData } from "@/lib/notification-routing";
import { configureNotifications, subscribeToPushTokenRefresh } from "@/lib/notifications";
import { clearSession, getSessionToken } from "@/lib/session";
import { fetchIntegrations, verifySession } from "@/lib/api";
import { subscribeToAppResume } from "@/lib/auth-lifecycle";
import { Pressable, Text, View } from "react-native";
import { authenticateForAppResume } from "@/lib/biometrics";
import { isDemoMode } from "@/lib/app-config";
import { BrandLoader } from "@/components/brand-loader";
import { AppAlertProvider } from "@/components/app-alert";

export default function RootLayout() {
  const responseSubscription = useRef<Notifications.EventSubscription | null>(null);
  const pushTokenSubscription = useRef<Notifications.EventSubscription | null>(null);
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
        .then(async () => {
          try {
            const integrations = await fetchIntegrations();
            const ready = integrations.some((item) => item.provider === "VERCEL" && item.connected) &&
              integrations.some((item) => item.provider === "RENDER" && item.connected);
            if (!ready && !cancelled) router.replace("/onboarding");
          } catch {
            // Keep the app available during an integration service outage.
          }
          if (!cancelled) setSessionChecked(true);
        })
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
    pushTokenSubscription.current = subscribeToPushTokenRefresh();
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
      pushTokenSubscription.current?.remove();
      unsubscribeResume();
    };
  }, []);

  const unlock = async () => {
    if (await authenticateForAppResume()) setBiometricLocked(false);
  };

  const content = !sessionChecked ? (
    <View className="flex-1 items-center justify-center bg-white">
      <BrandLoader label="Loading Deplo" />
    </View>
  ) : biometricLocked ? (
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
  ) : (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#FFFFFF" },
        }}
      />
      <StatusBar style="dark" />
    </>
  );

  return (
    <SafeAreaProvider>
      <AppAlertProvider>{content}</AppAlertProvider>
    </SafeAreaProvider>
  );
}
