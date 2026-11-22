import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { AlertTriangle, Bell, CheckCircle2, PauseCircle, Rocket } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { useCachedData } from "@/hooks/use-cached-data";
import { fetchMobileNotifications, markMobileNotificationRead } from "@/lib/api";
import { isDemoMode } from "@/lib/app-config";
import { getNotificationRoute } from "@/lib/notification-routing";
import type { MobileNotification } from "@/types/notifications";

const demoNotifications: MobileNotification[] = [
  {
    id: "demo-failure",
    category: "deployment-failed",
    title: "payment-api deployment failed",
    body: "Dependency install · Cannot resolve package",
    createdAt: "2026-11-22T18:44:00+05:30",
    isRead: false,
    route: "deployment",
    deploymentId: "dep_api",
  },
  {
    id: "demo-success",
    category: "deployment-success",
    title: "storefront is live",
    body: "Frontend and backend healthy",
    createdAt: "2026-11-22T18:28:00+05:30",
    isRead: true,
    route: "deployment",
    deploymentId: "dep_storefront",
  },
  {
    id: "demo-env",
    category: "environment-required",
    title: "docs-preview requires environment values",
    body: "Required variables are needed before deployment.",
    createdAt: "2026-11-21T18:00:00+05:30",
    isRead: true,
    route: "environment",
    deploymentId: "dep_api",
  },
];

function getNotificationIcon(category: string) {
  if (category === "deployment-failed" || category === "project-down") {
    return { kind: "alert" as const, iconClass: "text-red-700", surfaceClass: "bg-red-50 border-red-200" };
  }
  if (category === "deployment-success" || category === "deployment-completed" || category === "project-recovered") {
    return { kind: "success" as const, iconClass: "text-green-700", surfaceClass: "bg-green-50 border-green-200" };
  }
  if (category === "environment-required") {
    return { kind: "pause" as const, iconClass: "text-amber-700", surfaceClass: "bg-amber-50 border-amber-200" };
  }
  if (category === "deployment-started") {
    return { kind: "rocket" as const, iconClass: "text-cyan-700", surfaceClass: "bg-cyan-50 border-cyan-200" };
  }
  return { kind: "bell" as const, iconClass: "text-slate-600", surfaceClass: "bg-slate-50 border-slate-200" };
}

function formatNotificationTime(value: string) {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return value;
  return timestamp.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function NotificationsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const state = useCachedData<MobileNotification[]>(
    "deplo.mobile.notifications.history",
    demoNotifications,
    isDemoMode ? async () => demoNotifications : fetchMobileNotifications,
  );
  const notifications = state.data ?? [];

  async function refresh() {
    setRefreshing(true);
    await state.refresh();
    setRefreshing(false);
  }

  async function openNotification(notification: MobileNotification) {
    if (!notification.isRead && !isDemoMode) {
      try {
        await markMobileNotificationRead(notification.id);
        await state.refresh();
      } catch {
        // Navigation should still work when updating read state is unavailable.
      }
    }
    router.push(getNotificationRoute(notification) as never);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F6FAFE]" edges={["top"]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#0A0A0A" />}
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="Activity"
          title="Notifications"
          description="Deployment outcomes and project health updates."
        />
        <View className="mx-5 mb-3 flex-row items-center justify-between">
          <Text className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {state.stale ? "Saved history" : "Recent activity"}
          </Text>
          {state.unavailable ? <Text className="font-mono text-[10px] text-amber-700">Offline · may be stale</Text> : null}
        </View>
        <View className="mx-5 border border-slate-200 bg-white">
          {notifications.map((notification, index) => {
            const { kind, iconClass, surfaceClass } = getNotificationIcon(notification.category);
            return (
              <Pressable
                key={notification.id}
                accessibilityRole="button"
                accessibilityLabel={`${notification.isRead ? "Read" : "Unread"}: ${notification.title}`}
                onPress={() => void openNotification(notification)}
                className={`flex-row gap-3 p-4 ${index > 0 ? "border-t border-slate-200" : ""} ${notification.isRead ? "" : "bg-cyan-50/40"}`}
              >
                <View className={`h-10 w-10 items-center justify-center border ${surfaceClass}`}>
                  {kind === "alert" ? <AlertTriangle size={17} strokeWidth={1.8} className={iconClass} /> : null}
                  {kind === "success" ? <CheckCircle2 size={17} strokeWidth={1.8} className={iconClass} /> : null}
                  {kind === "pause" ? <PauseCircle size={17} strokeWidth={1.8} className={iconClass} /> : null}
                  {kind === "rocket" ? <Rocket size={17} strokeWidth={1.8} className={iconClass} /> : null}
                  {kind === "bell" ? <Bell size={17} strokeWidth={1.8} className={iconClass} /> : null}
                </View>
                <View className="flex-1">
                  <View className="flex-row items-start gap-2">
                    <Text className="flex-1 text-[13px] font-bold leading-5 text-deplo-black">
                      {notification.title}
                    </Text>
                    {!notification.isRead ? <View className="mt-1.5 h-2 w-2 rounded-full bg-cyan-600" /> : null}
                  </View>
                  <Text className="mt-1 text-[12px] leading-4 text-slate-500">{notification.body}</Text>
                  <Text className="mt-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    {formatNotificationTime(notification.createdAt)}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          {!state.loading && notifications.length === 0 ? (
            <View className="items-center px-5 py-10">
              <Text className="text-[14px] font-bold text-deplo-black">No notifications yet</Text>
              <Text className="mt-1 text-center text-[12px] text-slate-500">
                Deployment and uptime updates will appear here.
              </Text>
            </View>
          ) : null}
        </View>
        {state.loading ? <Text className="mx-5 mt-3 text-[11px] text-slate-400">Updating notification history…</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}
