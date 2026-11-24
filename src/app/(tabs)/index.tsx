import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, View } from "react-native";
import { router } from "expo-router";
import { Activity, AlertTriangle, ArrowRight, Boxes, CheckCircle2, Cloud, Server } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MetricCard } from "@/components/metric-card";
import { ScreenHeader } from "@/components/screen-header";
import { StatusPill } from "@/components/status-pill";
import { useCachedData } from "@/hooks/use-cached-data";
import { fetchDeployments, fetchRepositories } from "@/lib/api";
import type { Deployment } from "@/types/deplo";
import { deployments as fixtureDeployments, projects as demoProjects } from "@/lib/mobile-data";
import type { Deployment as ApiDeployment, Repository } from "@/lib/deplo-api";
import { isDemoMode } from "@/lib/app-config";
import { DemoBanner } from "@/components/demo-banner";

const demoRepositories: Repository[] = demoProjects.map((project) => ({
  id: project.id,
  name: project.name,
  fullName: project.repository,
  isPrivate: project.private,
  defaultBranch: project.branch,
  updatedAt: "",
  language: null,
  description: null,
  url: `https://github.com/${project.repository}`,
}));

const activeStatuses = new Set(["PENDING", "ANALYZING", "DEPLOYING_BACKEND", "BACKEND_READY", "DEPLOYING_FRONTEND"]);

function statusPresentation(status: Deployment["status"]) {
  if (status === "COMPLETED") return { label: "Succeeded", tone: "success" as const };
  if (status === "FAILED") return { label: "Failed", tone: "danger" as const };
  if (status === "WAITING_FOR_ENV") return { label: "Needs environment", tone: "warning" as const };
  if (status === "CANCELLED") return { label: "Cancelled", tone: "neutral" as const };
  return { label: "In progress", tone: "info" as const };
}

function statusDetail(deployment: Deployment) {
  if (deployment.status === "FAILED") return "Deployment failed";
  if (deployment.status === "WAITING_FOR_ENV") return "Waiting for required environment variables";
  if (deployment.status === "COMPLETED") return "Deployment completed";
  if (deployment.status === "CANCELLED") return "Deployment was cancelled";
  return `Deploying ${deployment.environment.toLowerCase()}`;
}

function toMobileDeployment(deployment: ApiDeployment): Deployment {
  return {
    id: deployment.id,
    projectId: deployment.repositoryId,
    repositoryId: deployment.repositoryId,
    projectName: deployment.repositoryName,
    repository: deployment.repositoryFullName,
    branch: deployment.branch,
    status: deployment.status,
    environment: deployment.branch === "main" || deployment.branch === "master" ? "Production" : "Preview",
    startedAt: deployment.createdAt,
    durationSeconds: deployment.duration ?? undefined,
    commit: deployment.updatedAt,
    frontendUrl: deployment.frontendUrl ?? undefined,
    backendUrl: deployment.backendUrl ?? undefined,
    requiredEnvVars: [],
  };
}

export default function OverviewScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const overview = useCachedData<Deployment[]>(
    "deplo.mobile.overview.deployments.v2",
    isDemoMode ? fixtureDeployments : [],
    isDemoMode
      ? async () => fixtureDeployments
      : async () => (await fetchDeployments()).map(toMobileDeployment),
  );
  const repositories = useCachedData<Repository[]>(
    "deplo.mobile.overview.repositories.v1",
    isDemoMode ? demoRepositories : [],
    isDemoMode ? async () => demoRepositories : fetchRepositories,
  );
  const repoCount = repositories.data?.length ?? 0;
  const deploymentRows = [...(overview.data ?? [])].sort(
    (a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime(),
  );
  const attentionCount = deploymentRows.filter((deployment) =>
    deployment.status === "FAILED" || deployment.status === "WAITING_FOR_ENV",
  ).length;
  const activeCount = deploymentRows.filter((deployment) => activeStatuses.has(deployment.status)).length;
  const completedCount = deploymentRows.filter((deployment) => deployment.status === "COMPLETED").length;
  const hasAttention = attentionCount > 0;
  const hasData = deploymentRows.length > 0;
  const bannerTone = hasAttention ? "danger" : hasData ? "success" : "neutral";

  async function refresh() {
    setRefreshing(true);
    await Promise.all([overview.refresh(), repositories.refresh()]);
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
          eyebrow="Workspace / Deployment overview"
          title="Deployment health"
          description="Recent deployment status from your Deplo workspace."
        />
        <DemoBanner />

        <View className={`mx-5 mb-5 border p-4 ${bannerTone === "danger" ? "border-red-200 bg-red-50" : bannerTone === "success" ? "border-green-200 bg-green-50" : "border-slate-200 bg-slate-50"}`}>
          <View className="flex-row items-center gap-2">
            {hasAttention ? (
              <AlertTriangle size={18} strokeWidth={1.8} className="text-red-700" />
            ) : hasData ? (
              <CheckCircle2 size={18} strokeWidth={1.8} className="text-green-700" />
            ) : (
              <Activity size={18} strokeWidth={1.8} className="text-slate-600" />
            )}
            <Text className={`text-[14px] font-bold ${bannerTone === "danger" ? "text-red-800" : bannerTone === "success" ? "text-green-800" : "text-slate-700"}`}>
              {!hasData ? "No deployment data available" : overview.unavailable ? "Showing cached deployment status" : hasAttention ? `${attentionCount} deployment${attentionCount === 1 ? "" : "s"} need attention` : "No recent deployment issues"}
            </Text>
          </View>
          <Text className={`mt-1.5 text-[12px] leading-5 ${bannerTone === "danger" ? "text-red-700" : bannerTone === "success" ? "text-green-700" : "text-slate-600"}`}>
            {!hasData ? "Pull to refresh when deployment data is available." : overview.stale ? "This is the last available deployment data; refresh when connected." : "This summary reflects the deployments currently available in the workspace."}
          </Text>
        </View>

        <View className="mx-5 flex-row gap-3">
          <MetricCard
            label="Success"
            value={String(completedCount)}
            detail="Completed in this list"
            icon={Cloud}
            tone="success"
          />
          <MetricCard
            label="Attention"
            value={String(attentionCount)}
            detail="Failed or waiting for setup"
            icon={AlertTriangle}
            tone="danger"
          />
        </View>

        <View className="mx-5 mt-5 flex-row gap-3">
          <MetricCard label="Active" value={String(activeCount)} detail="Deployments running" icon={Activity} />
          <Pressable accessibilityRole="button" onPress={() => router.push("/projects")} className="flex-1">
            <MetricCard label="Projects" value={String(repoCount)} detail="Synced repositories" icon={Boxes} />
          </Pressable>
        </View>

        <View className="mx-5 mt-7">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[15px] font-bold text-deplo-black">Recent deployments</Text>
            <Text className="font-mono text-[11px] text-slate-500">{deploymentRows.length} total</Text>
          </View>

          <View className="border border-slate-200 bg-white">
            {deploymentRows.slice(0, 5).map((deployment, index) => {
              const presentation = statusPresentation(deployment.status);
              return (
              <Pressable
                key={deployment.id}
                accessibilityRole="button"
                onPress={() => router.push(`/deployments/${deployment.id}`)}
                className={`p-4 ${index > 0 ? "border-t border-slate-200" : ""}`}
              >
                <View className="flex-row items-start justify-between gap-3">
                  <View className="flex-1">
                    <Text className="text-[14px] font-bold text-deplo-black">
                      {deployment.projectName}
                    </Text>
                    <Text className="mt-1 font-mono text-[11px] text-slate-500">
                      {deployment.branch} · {deployment.id}
                    </Text>
                  </View>
                  <StatusPill label={presentation.label} tone={presentation.tone} />
                </View>
                <Text numberOfLines={2} className="mt-3 text-[12px] text-slate-500">{statusDetail(deployment)}</Text>
              </Pressable>
            );})}
            {deploymentRows.length === 0 ? (
              <View className="items-center px-5 py-10">
                <Server size={22} strokeWidth={1.6} className="text-slate-400" />
                <Text className="mt-3 text-[14px] font-bold text-deplo-black">
                  {overview.loading ? "Loading deployments…" : repoCount === 0 ? "No repositories synced yet" : "No deployments yet"}
                </Text>
                <Text className="mt-1 text-center text-[12px] leading-5 text-slate-500">
                  {overview.loading
                    ? "Fetching deployment status from Deplo."
                    : repoCount === 0
                      ? "Connect a GitHub repository from Projects to deploy your first app."
                      : `You have ${repoCount} repositor${repoCount === 1 ? "y" : "ies"} synced. Deploy one to see it here.`}
                </Text>
                {!overview.loading ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push("/projects")}
                    className="mt-4 flex-row items-center gap-2 border border-deplo-black bg-deplo-black px-4 py-3"
                  >
                    <Text className="font-mono text-[11px] font-bold uppercase text-white">
                      {repoCount === 0 ? "Sync repositories" : "Go to projects"}
                    </Text>
                    <ArrowRight size={13} strokeWidth={2} color="#FFFFFF" />
                  </Pressable>
                ) : null}
              </View>
            ) : null}
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
