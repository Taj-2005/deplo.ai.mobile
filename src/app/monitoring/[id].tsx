import { useMemo, useState } from "react";
import { Linking, Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ExternalLink, Globe, RefreshCw, Server } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getConnectivity } from "@/lib/connectivity";
import { monitoringSnapshots } from "@/lib/monitoring-data";
import { useCachedData } from "@/hooks/use-cached-data";
import { fetchProjectMonitoring } from "@/lib/api";
import type { MonitoringSnapshot, TargetHealth } from "@/types/monitoring";

function healthTone(health: TargetHealth) {
  if (health === "up") return "bg-green-500";
  if (health === "down") return "bg-red-500";
  return "bg-slate-400";
}

function healthLabel(health: TargetHealth) {
  if (health === "up") return "Responding";
  if (health === "down") return "Down";
  return "Unknown";
}

export default function MonitoringScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fallback = monitoringSnapshots[id] as MonitoringSnapshot | undefined;
  const monitoringState = useCachedData<MonitoringSnapshot>(
    `deplo.mobile.monitoring.${id}`,
    fallback ?? {
      projectId: id,
      frontend: { url: "", health: "unknown", latencyMs: null, lastCheckedAt: "" },
      backend: { url: "", health: "unknown", latencyMs: null, lastCheckedAt: "" },
      uptime24h: 0,
      downtimeEvents24h: 0,
      updatedAt: "",
    },
    async () => {
      const data = await fetchProjectMonitoring(id);
      return {
        projectId: data.project.id,
        frontend: {
          url: data.frontend.url ?? "",
          health: data.frontend.current ? (data.frontend.current.ok ? "up" : "down") : "unknown",
          latencyMs: data.frontend.current?.latencyMs ?? null,
          lastCheckedAt: data.frontend.current?.checkedAt ?? "",
        },
        backend: {
          url: data.backend.url ?? "",
          health: data.backend.current ? (data.backend.current.ok ? "up" : "down") : "unknown",
          latencyMs: data.backend.current?.latencyMs ?? null,
          lastCheckedAt: data.backend.current?.checkedAt ?? "",
        },
        uptime24h: data.frontend.uptime24h ?? data.backend.uptime24h ?? 0,
        downtimeEvents24h: 0,
        updatedAt: new Date().toISOString(),
      };
    },
  );
  const snapshot = monitoringState.data;
  const [refreshing, setRefreshing] = useState(false);
  const [offline, setOffline] = useState(false);

  const worstHealth = useMemo(() => {
    if (!snapshot) return "unknown";
    if (snapshot.frontend.health === "down" || snapshot.backend.health === "down") return "down";
    if (snapshot.frontend.health === "up" || snapshot.backend.health === "up") return "up";
    return "unknown";
  }, [snapshot]);

  async function refresh() {
    setRefreshing(true);
    const connectivity = await getConnectivity();
    setOffline(!connectivity.connected || connectivity.internetReachable === false);
    await monitoringState.refresh();
    setTimeout(() => setRefreshing(false), 500);
  }

  if (!snapshot) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F6FAFE] px-8">
        <Text className="text-[16px] font-bold text-deplo-black">Monitoring unavailable</Text>
        <Pressable onPress={() => router.back()} className="mt-4 border border-slate-200 px-4 py-3">
          <Text className="font-mono text-[12px] text-slate-600">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F6FAFE]" edges={["top"]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#0A0A0A" />
        }
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View className="px-5 pb-5 pt-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="mb-5 h-9 w-9 items-center justify-center border border-slate-200 bg-white"
          >
            <ArrowLeft size={17} strokeWidth={1.8} className="text-slate-600" />
          </Pressable>
          <Text className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Monitoring / {snapshot.projectId}
          </Text>
          <View className="mt-1 flex-row items-center gap-2">
            <Text className="text-[30px] font-bold tracking-tight text-deplo-black">Health</Text>
            <View className={`h-2.5 w-2.5 rounded-full ${healthTone(worstHealth as TargetHealth)}`} />
          </View>
        </View>

        {offline ? (
          <View className="mx-5 mb-5 border border-amber-200 bg-amber-50 p-4">
            <Text className="text-[12px] leading-5 text-amber-800">
              Offline — this screen may contain stale monitoring data.
            </Text>
          </View>
        ) : null}

        <View className="mx-5 border border-slate-200 bg-white">
          {[
            { label: "Frontend", icon: Globe, target: snapshot.frontend },
            { label: "Backend", icon: Server, target: snapshot.backend },
          ].map(({ label, icon: Icon, target }, index) => (
            <View
              key={label}
              className={`p-4 ${index > 0 ? "border-t border-slate-200" : ""}`}
            >
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center border border-slate-200 bg-slate-50">
                  <Icon size={16} strokeWidth={1.7} className="text-slate-600" />
                </View>
                <View className="flex-1">
                  <Text className="font-mono text-[10px] uppercase text-slate-500">{label}</Text>
                  <Text className="mt-1 text-[13px] font-bold text-deplo-black">
                    {healthLabel(target.health)}
                  </Text>
                </View>
                <View className={`h-2.5 w-2.5 rounded-full ${healthTone(target.health)}`} />
              </View>

              {target.url ? (
                <Pressable
                  accessibilityRole="link"
                  onPress={() => void Linking.openURL(target.url)}
                  className="mt-3 flex-row items-center justify-between border-t border-slate-100 pt-3"
                >
                  <Text className="flex-1 font-mono text-[11px] text-slate-600">
                    {target.url.replace(/^https?:\/\//, "")}
                  </Text>
                  <ExternalLink size={13} strokeWidth={1.7} className="text-slate-400" />
                </Pressable>
              ) : null}

              <View className="mt-3 flex-row gap-4">
                <View>
                  <Text className="font-mono text-[9px] uppercase text-slate-400">Latency</Text>
                  <Text className="mt-1 font-mono text-[12px] text-deplo-black">
                    {target.latencyMs === null ? "Unavailable" : `${target.latencyMs} ms`}
                  </Text>
                </View>
                <View>
                  <Text className="font-mono text-[9px] uppercase text-slate-400">Checked</Text>
                  <Text className="mt-1 font-mono text-[12px] text-deplo-black">Recently</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <View className="mx-5 mt-5 flex-row gap-3">
          <View className="flex-1 border border-slate-200 bg-white p-4">
            <Text className="font-mono text-[10px] uppercase text-slate-500">24h uptime</Text>
            <Text className="mt-2 text-[24px] font-bold text-deplo-black">
              {snapshot.uptime24h.toFixed(2)}%
            </Text>
          </View>
          <View className="flex-1 border border-slate-200 bg-white p-4">
            <Text className="font-mono text-[10px] uppercase text-slate-500">Downtime</Text>
            <Text className="mt-2 text-[24px] font-bold text-deplo-black">
              {snapshot.downtimeEvents24h}
            </Text>
            <Text className="mt-1 text-[10px] text-slate-500">events / 24h</Text>
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => void refresh()}
          className="mx-5 mt-5 flex-row items-center justify-center gap-2 border border-deplo-black bg-deplo-black py-4"
        >
          <RefreshCw size={14} strokeWidth={1.8} className="text-white" />
          <Text className="font-mono text-[12px] font-bold text-white">Refresh health</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
