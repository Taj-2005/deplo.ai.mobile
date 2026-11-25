import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { ArrowLeft, Rocket } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusPill } from "@/components/status-pill";
import { useCachedData } from "@/hooks/use-cached-data";
import { fetchDeployments } from "@/lib/api";
import type { Deployment } from "@/lib/deplo-api";
import { deployments as demoDeployments } from "@/lib/mobile-data";
import { isDemoMode } from "@/lib/app-config";

const demoApiDeployments: Deployment[] = demoDeployments.map((deployment) => ({
  id: deployment.id,
  repositoryId: deployment.repositoryId,
  repositoryName: deployment.projectName,
  repositoryFullName: deployment.repository,
  status: deployment.status,
  branch: deployment.branch,
  frontendUrl: deployment.frontendUrl ?? null,
  backendUrl: deployment.backendUrl ?? null,
  detectedStack: null,
  createdAt: deployment.startedAt,
  updatedAt: deployment.startedAt,
  duration: deployment.durationSeconds ?? null,
}));

function statusPresentation(status: Deployment["status"]) {
  if (status === "COMPLETED") return { label: "Succeeded", tone: "success" as const };
  if (status === "FAILED") return { label: "Failed", tone: "danger" as const };
  if (status === "WAITING_FOR_ENV") return { label: "Needs environment", tone: "warning" as const };
  if (status === "CANCELLED") return { label: "Cancelled", tone: "neutral" as const };
  return { label: "In progress", tone: "info" as const };
}

function formatWhen(value: string) {
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return value;
  return timestamp.toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

export default function AllDeploymentsScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const state = useCachedData<Deployment[]>(
    "deplo.mobile.deployments.all.v1",
    isDemoMode ? demoApiDeployments : [],
    isDemoMode ? async () => demoApiDeployments : fetchDeployments,
  );
  const deployments = [...(state.data ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  async function refresh() {
    setRefreshing(true);
    await state.refresh();
    setRefreshing(false);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F6FAFE]" edges={["top"]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#0A0A0A" />}
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
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
            Workspace
          </Text>
          <Text className="mt-1 text-[28px] font-bold tracking-tight text-deplo-black">All deployments</Text>
          <Text className="mt-2 text-[13px] text-slate-500">
            {state.unavailable
              ? state.error ?? "Showing cached deployments"
              : `${deployments.length} deployment${deployments.length === 1 ? "" : "s"} across every project.`}
          </Text>
        </View>

        <View className="mx-5 border border-slate-200 bg-white">
          {deployments.map((deployment, index) => {
            const presentation = statusPresentation(deployment.status);
            const providers = [deployment.frontendUrl ? "Frontend" : null, deployment.backendUrl ? "Backend" : null]
              .filter(Boolean)
              .join(" · ");
            return (
              <Pressable
                key={deployment.id}
                accessibilityRole="button"
                onPress={() => router.push(`/deployments/${deployment.id}`)}
                className={`p-4 ${index > 0 ? "border-t border-slate-200" : ""}`}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-deplo-black">{deployment.repositoryName}</Text>
                    <Text className="mt-1 font-mono text-[11px] text-slate-500">
                      {deployment.repositoryFullName} · {deployment.branch}
                    </Text>
                  </View>
                  <StatusPill label={presentation.label} tone={presentation.tone} />
                </View>
                <View className="mt-3 flex-row items-center justify-between">
                  <Text className="font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    {formatWhen(deployment.createdAt)}
                  </Text>
                  {providers ? (
                    <Text className="font-mono text-[10px] uppercase text-slate-400">{providers}</Text>
                  ) : null}
                </View>
              </Pressable>
            );
          })}
          {deployments.length === 0 ? (
            <View className="items-center px-5 py-12">
              <Rocket size={22} strokeWidth={1.6} className="text-slate-400" />
              <Text className="mt-3 text-[14px] font-bold text-deplo-black">
                {state.loading ? "Loading deployments…" : "No deployments yet"}
              </Text>
              <Text className="mt-1 text-center text-[12px] leading-5 text-slate-500">
                {state.loading
                  ? "Fetching every deployment in your workspace."
                  : "Deploy a project to see it listed here."}
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
