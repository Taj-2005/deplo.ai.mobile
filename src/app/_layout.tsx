import "../../global.css";

import { useEffect, useRef } from "react";
import { router, Stack } from "expo-router";
import * as Notifications from "expo-notifications";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { getNotificationRoute, type NotificationRouteData } from "@/lib/notification-routing";
import { configureNotifications } from "@/lib/notifications";

export default function RootLayout() {
  const responseSubscription = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
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

    return () => {
      responseSubscription.current?.remove();
    };
  }, []);

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
