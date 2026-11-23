import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ExternalLink, GitBranch, Globe, Server } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusPill } from "@/components/status-pill";
import { getLatestDeployment, getProject } from "@/lib/mobile-data";
import { useCachedData } from "@/hooks/use-cached-data";
import { fetchDeployments, fetchRepositories } from "@/lib/api";
import type { Deployment as ApiDeployment, Repository } from "@/lib/deplo-api";
import { isDemoMode } from "@/lib/app-config";

type LatestDeployment = Pick<ApiDeployment, "id" | "status" | "branch" | "frontendUrl" | "backendUrl" | "createdAt">;

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const fallbackProject = isDemoMode ? getProject(id) : undefined;
  const repositoriesState = useCachedData<Repository[]>(
    "deplo.mobile.projects.v2",
    isDemoMode && fallbackProject
      ? [{
          id,
          name: fallbackProject.name,
          fullName: fallbackProject.repository,
          isPrivate: fallbackProject.private,
          defaultBranch: fallbackProject.branch,
          updatedAt: "",
          language: "TypeScript",
          description: null,
          url: `https://github.com/${fallbackProject.repository}`,
        }]
      : [],
    isDemoMode ? async () => fallbackProject ? [{
      id,
      name: fallbackProject.name,
      fullName: fallbackProject.repository,
      isPrivate: fallbackProject.private,
      defaultBranch: fallbackProject.branch,
      updatedAt: "",
      language: "TypeScript",
      description: null,
      url: `https://github.com/${fallbackProject.repository}`,
    }] : [] : fetchRepositories,
  );
  const projectRepository = repositoriesState.data?.find((repository) => repository.id === id);
  const latestDeploymentState = useCachedData<LatestDeployment | null>(
    `deplo.mobile.project.${id}.deployments.v2`,
    isDemoMode && getLatestDeployment(id)
      ? (() => {
          const deployment = getLatestDeployment(id)!;
          return {
            id: deployment.id,
            status: deployment.status,
            branch: deployment.branch,
            frontendUrl: deployment.frontendUrl ?? null,
            backendUrl: deployment.backendUrl ?? null,
            createdAt: deployment.startedAt,
          };
        })()
      : null,
    async () => {
      if (isDemoMode) {
        const deployment = getLatestDeployment(id);
        return deployment ? {
          id: deployment.id,
          status: deployment.status,
          branch: deployment.branch,
          frontendUrl: deployment.frontendUrl ?? null,
          backendUrl: deployment.backendUrl ?? null,
          createdAt: deployment.startedAt,
        } : null;
      }
      const deployments = await fetchDeployments();
      const deployment = deployments
        .filter((item) => item.repositoryId === id)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
      return deployment ? {
        id: deployment.id,
        status: deployment.status,
        branch: deployment.branch,
        frontendUrl: deployment.frontendUrl,
        backendUrl: deployment.backendUrl,
        createdAt: deployment.createdAt,
      } : null;
    },
  );
  const latestDeployment = latestDeploymentState.data;
  const project = fallbackProject ?? (projectRepository ? {
    id: projectRepository.id,
    name: projectRepository.name,
    repository: projectRepository.fullName,
    branch: projectRepository.defaultBranch,
    private: projectRepository.isPrivate,
    environment: "Preview" as const,
    status: "Preview" as const,
  } : null);

  if (!project) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F6FAFE] px-8">
        {repositoriesState.loading ? (
          <Text className="text-[14px] text-slate-600">Loading project…</Text>
        ) : (
          <>
            <Text className="text-[16px] font-bold text-deplo-black">Project unavailable</Text>
            <Pressable onPress={() => router.back()} className="mt-4 border border-slate-200 px-4 py-3">
              <Text className="font-mono text-[12px] text-slate-600">Go back</Text>
            </Pressable>
          </>
        )}
      </SafeAreaView>
    );
  }

  const projectStatus = latestDeployment?.status === "COMPLETED"
    ? { label: "Succeeded", tone: "success" as const }
    : latestDeployment?.status === "FAILED"
      ? { label: "Failed", tone: "danger" as const }
      : latestDeployment?.status === "CANCELLED"
        ? { label: "Cancelled", tone: "neutral" as const }
        : latestDeployment
          ? { label: latestDeployment.status === "WAITING_FOR_ENV" ? "Needs setup" : "Deploying", tone: "warning" as const }
          : { label: "No deployments", tone: "neutral" as const };

  return (
    <SafeAreaView className="flex-1 bg-[#F6FAFE]" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }}>
        <View className="px-5 pb-5 pt-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="mb-5 h-9 w-9 items-center justify-center border border-slate-200 bg-white"
          >
            <ArrowLeft size={17} strokeWidth={1.8} className="text-slate-600" />
          </Pressable>
          <Text className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
            {latestDeployment?.branch === "main" || latestDeployment?.branch === "master"
              ? "Production"
              : project.environment} project
          </Text>
          <View className="mt-1 flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-[30px] font-bold tracking-tight text-deplo-black">
              {project.name}
            </Text>
            <StatusPill
              label={projectStatus.label}
              tone={projectStatus.tone}
            />
          </View>
          <View className="mt-2 flex-row items-center gap-2">
            <GitBranch size={12} strokeWidth={1.7} className="text-slate-500" />
            <Text className="font-mono text-[12px] text-slate-500">
              {project.repository} · {project.branch}
            </Text>
          </View>
        </View>

        <View className="mx-5 border border-slate-200 bg-white">
          {(latestDeployment?.frontendUrl ?? project.frontendUrl) ? (
            <View className="flex-row items-center gap-3 border-b border-slate-200 p-4">
              <Globe size={16} strokeWidth={1.7} className="text-slate-600" />
              <View className="flex-1">
                <Text className="font-mono text-[10px] uppercase text-slate-500">Frontend</Text>
                <Text className="mt-1 text-[12px] text-deplo-black">{latestDeployment?.frontendUrl ?? project.frontendUrl}</Text>
              </View>
              <ExternalLink size={14} strokeWidth={1.7} className="text-slate-400" />
            </View>
          ) : null}
          {(latestDeployment?.backendUrl ?? project.backendUrl) ? (
            <View className="flex-row items-center gap-3 p-4">
              <Server size={16} strokeWidth={1.7} className="text-slate-600" />
              <View className="flex-1">
                <Text className="font-mono text-[10px] uppercase text-slate-500">Backend</Text>
                <Text className="mt-1 text-[12px] text-deplo-black">{latestDeployment?.backendUrl ?? project.backendUrl}</Text>
              </View>
              <ExternalLink size={14} strokeWidth={1.7} className="text-slate-400" />
            </View>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/configure/${id}`)}
          className="mx-5 mt-5 items-center border border-deplo-black bg-deplo-black px-4 py-4"
        >
          <Text className="font-mono text-[13px] font-bold text-white">Configure and deploy</Text>
        </Pressable>
        {latestDeployment ? <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/deployments/${latestDeployment.id}`)}
          className="mx-5 mt-3 items-center border border-slate-300 bg-white px-4 py-4"
        >
          <Text className="font-mono text-[13px] font-bold text-slate-700">View latest deployment</Text>
        </Pressable> : null}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/monitoring/${id}`)}
          className="mx-5 mt-3 items-center border border-slate-300 bg-white px-4 py-4"
        >
          <Text className="font-mono text-[13px] font-bold text-slate-700">Open monitoring</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/project/${id}/alerts`)}
          className="mx-5 mt-3 items-center border border-slate-300 bg-white px-4 py-4"
        >
          <Text className="font-mono text-[13px] font-bold text-slate-700">Project alert preferences</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
