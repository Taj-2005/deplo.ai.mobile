import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Activity, AlertTriangle, CheckCircle2, Cloud, Server } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MetricCard } from "@/components/metric-card";
import { ScreenHeader } from "@/components/screen-header";
import { StatusPill } from "@/components/status-pill";
import { useCachedData } from "@/hooks/use-cached-data";
import { apiFetch } from "@/lib/api";
import type { Deployment } from "@/types/deplo";

const recentDeployments = [
  {
    id: "dep_storefront",
    name: "storefront",
    branch: "main",
    status: "Live",
    tone: "success" as const,
    detail: "Frontend and backend healthy",
  },
  {
    id: "dep_api",
    name: "payment-api",
    branch: "main",
    status: "Failed",
    tone: "danger" as const,
    detail: "Build failed in dependency install",
  },
];

export default function OverviewScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const overview = useCachedData<Deployment[]>(
    "deplo.mobile.overview.deployments",
    [
      {
        id: "dep_storefront",
        projectId: "storefront",
        projectName: "storefront",
        repository: "taj-2005/storefront",
        branch: "main",
        status: "COMPLETED",
        environment: "Production",
        startedAt: "2026-11-22T03:42:00+05:30",
        durationSeconds: 98,
        commit: "3f8a2c1",
        frontendUrl: "https://storefront.vercel.app",
        backendUrl: "https://storefront-api.onrender.com",
        requiredEnvVars: [],
      },
      {
        id: "dep_api",
        projectId: "payment-api",
        projectName: "payment-api",
        repository: "taj-2005/payment-api",
        branch: "main",
        status: "FAILED",
        environment: "Production",
        startedAt: "2026-11-22T03:58:00+05:30",
        durationSeconds: 42,
        commit: "9e21bc4",
        backendUrl: "https://payment-api.onrender.com",
        firstError: "Cannot resolve dependency: @acme/payment-core",
        requiredEnvVars: [],
      },
    ],
    () => apiFetch<Deployment[]>("/api/v1/mobile/deployments"),
  );

  async function refresh() {
    setRefreshing(true);
    await overview.refresh();
    setRefreshing(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F6FAFE]" edges={["top"]}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#0A0A0A" />
        }
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="Workspace / 22 Nov"
          title="Good morning"
          description="Review system health and respond to deployments."
        />

        <View className="mx-5 mb-5 border border-green-200 bg-green-50 p-4">
          <View className="flex-row items-center gap-2">
            <CheckCircle2 size={18} strokeWidth={1.8} className="text-green-700" />
            <Text className="text-[14px] font-bold text-green-800">Systems operational</Text>
          </View>
          <Text className="mt-1.5 text-[12px] leading-5 text-green-700">
            3 production targets are responding within their current health window.
          </Text>
        </View>

        <View className="mx-5 flex-row gap-3">
          <MetricCard
            label="Live"
            value="6"
            detail="Across 4 projects"
            icon={Cloud}
            tone="success"
          />
          <MetricCard
            label="Attention"
            value="1"
            detail="Requires action"
            icon={AlertTriangle}
            tone="danger"
          />
        </View>

        <View className="mx-5 mt-5 flex-row gap-3">
          <MetricCard label="Active" value="2" detail="Deployments running" icon={Activity} />
          <MetricCard label="Success" value="94%" detail="Last 30 days" icon={Server} />
        </View>

        <View className="mx-5 mt-7">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[15px] font-bold text-deplo-black">Recent deployments</Text>
            <Text className="font-mono text-[11px] text-slate-500">View all</Text>
          </View>

          <View className="border border-slate-200 bg-white">
            {recentDeployments.map((deployment, index) => (
              <Pressable
                key={deployment.id}
                accessibilityRole="button"
                onPress={() => router.push(`/deployments/${deployment.id}`)}
                className={`p-4 ${index > 0 ? "border-t border-slate-200" : ""}`}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-deplo-black">
                      {deployment.name}
                    </Text>
                    <Text className="mt-1 font-mono text-[11px] text-slate-500">
                      {deployment.branch} · {deployment.id}
                    </Text>
                  </View>
                  <StatusPill label={deployment.status} tone={deployment.tone} />
                </View>
                <Text className="mt-3 text-[12px] text-slate-500">{deployment.detail}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View className="mx-5 mt-5 border border-slate-200 bg-white p-4">
          <Text className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Last updated
          </Text>
          <Text className="mt-1 text-[12px] text-slate-600">
            {overview.unavailable
              ? `${overview.error ?? "Server unavailable"} · Status may be stale`
              : overview.loading
                ? "Refreshing from Deplo"
                : overview.updatedAt
                  ? `Updated ${new Date(overview.updatedAt).toLocaleTimeString()}`
                  : "Status unavailable"}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
