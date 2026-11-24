import { useState } from "react";
import { Pressable, RefreshControl, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Boxes, FolderGit2, Lock, RefreshCw, Search, Server } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { StatusPill } from "@/components/status-pill";
import { useCachedData } from "@/hooks/use-cached-data";
import { fetchDeployments, fetchRepositories, syncRepositories } from "@/lib/api";
import type { Deployment, Repository } from "@/lib/deplo-api";
import { isDemoMode } from "@/lib/app-config";
import { projects as demoProjects, deployments as demoDeployments } from "@/lib/mobile-data";

type ProjectData = { repositories: Repository[]; deployments: Deployment[] };

const demoProjectData: ProjectData = {
  repositories: demoProjects.map((project) => ({
    id: project.id,
    name: project.name,
    fullName: project.repository,
    isPrivate: project.private,
    defaultBranch: project.branch,
    updatedAt: "",
    language: null,
    description: null,
    url: `https://github.com/${project.repository}`,
  })),
  deployments: demoDeployments.map((deployment) => ({
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
  })),
};

function deploymentStatus(deployment?: Deployment) {
  if (!deployment) return { label: "No deployment", tone: "neutral" as const };
  if (deployment.status === "COMPLETED") return { label: "Live", tone: "success" as const };
  if (deployment.status === "FAILED") return { label: "Failed", tone: "danger" as const };
  if (deployment.status === "CANCELLED") return { label: "Cancelled", tone: "neutral" as const };
  if (deployment.status === "WAITING_FOR_ENV") return { label: "Needs setup", tone: "warning" as const };
  return { label: "Deploying", tone: "info" as const };
}

export default function ProjectsScreen() {
  const [query, setQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");
  const projectState = useCachedData<ProjectData>(
    "deplo.mobile.projects-and-deployments",
    isDemoMode ? demoProjectData : { repositories: [], deployments: [] },
    async () => {
      if (isDemoMode) return demoProjectData;
      const [repositories, deployments] = await Promise.all([fetchRepositories(), fetchDeployments()]);
      return { repositories, deployments };
    },
  );
  const normalizedProjects = (projectState.data?.repositories ?? []).map((project) => {
    const latestDeployment = (projectState.data?.deployments ?? [])
      .filter((deployment) => deployment.repositoryId === project.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))[0];
    const status = deploymentStatus(latestDeployment);
    return {
      name: project.name,
      owner: project.fullName,
      branch: project.defaultBranch,
      private: project.isPrivate,
      status: status.label,
      tone: status.tone,
      id: project.id,
      hasFrontend: Boolean(latestDeployment?.frontendUrl),
      hasBackend: Boolean(latestDeployment?.backendUrl),
    };
  });
  const filtered = normalizedProjects.filter((project) =>
    `${project.name} ${project.owner}`.toLowerCase().includes(query.toLowerCase()),
  );

  async function refresh() {
    setRefreshing(true);
    setSyncMessage("");
    try {
      if (!isDemoMode) await syncRepositories();
      await projectState.refresh();
      setSyncMessage("GitHub repositories are up to date.");
    } catch (error) {
      setSyncMessage(error instanceof Error ? error.message : "Could not sync GitHub repositories.");
      await projectState.refresh();
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F6FAFE]" edges={["top"]}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#0A0A0A" />}
        contentContainerStyle={{ paddingBottom: 28 }}
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          eyebrow="Workspace"
          title="Projects"
          description="Review repositories and current production health."
        />

        <View className="mx-5 mb-5 flex-row items-center border border-slate-200 bg-white px-3">
          <Search size={16} strokeWidth={1.7} className="text-slate-400" />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search projects"
            placeholderTextColor="#94A3B8"
            className="flex-1 py-3 pl-2.5 font-mono text-[13px] text-deplo-black"
          />
        </View>

        <Pressable accessibilityRole="button" disabled={refreshing} onPress={() => void refresh()} className="mx-5 mb-4 flex-row items-center justify-center gap-2 border border-deplo-black bg-white px-4 py-3">
          <RefreshCw size={14} strokeWidth={1.8} color="#111111" />
          <Text className="font-mono text-[11px] font-bold uppercase text-deplo-black">{refreshing ? "Syncing GitHub…" : "Sync GitHub repositories"}</Text>
        </Pressable>
        {syncMessage ? <Text className="mx-5 mb-3 text-[11px] text-slate-500">{syncMessage}</Text> : null}

        <View className="mx-5 border border-slate-200 bg-white">
          {filtered.map((project, index) => (
            <Pressable
              key={project.id}
              accessibilityRole="button"
              onPress={() => router.push(`/project/${project.id}`)}
              className={`flex-row items-center gap-3 p-4 ${index > 0 ? "border-t border-slate-200" : ""}`}
            >
              <View className="h-11 w-11 items-center justify-center border border-slate-200 bg-slate-50">
                {project.owner.includes("deplolabs") ? (
                  <FolderGit2 size={18} strokeWidth={1.7} className="text-slate-600" />
                ) : (
                  <Boxes size={18} strokeWidth={1.7} className="text-slate-600" />
                )}
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-1.5">
                  <Text className="text-[14px] font-bold text-deplo-black">{project.name}</Text>
                  {project.private ? <Lock size={10} strokeWidth={2} className="text-slate-400" /> : null}
                </View>
                <Text className="mt-1 font-mono text-[11px] text-slate-500">
                  {project.owner} · {project.branch}
                </Text>
                {project.hasFrontend || project.hasBackend ? (
                  <View className="mt-1.5 flex-row items-center gap-2">
                    {project.hasFrontend ? (
                      <View className="flex-row items-center gap-1">
                        <Text className="text-[9px] font-black text-slate-500">▲</Text>
                        <Text className="font-mono text-[9px] uppercase text-slate-500">Vercel</Text>
                      </View>
                    ) : null}
                    {project.hasBackend ? (
                      <View className="flex-row items-center gap-1">
                        <Server size={9} strokeWidth={2} className="text-slate-500" />
                        <Text className="font-mono text-[9px] uppercase text-slate-500">Render</Text>
                      </View>
                    ) : null}
                  </View>
                ) : null}
              </View>
              <StatusPill label={project.status} tone={project.tone} />
            </Pressable>
          ))}

          {filtered.length === 0 ? (
            <View className="items-center px-5 py-10">
              <Text className="text-[14px] font-bold text-deplo-black">
                {projectState.loading
                  ? "Loading repositories…"
                  : projectState.reason === "unauthorized"
                    ? "Sign in required"
                    : projectState.unavailable
                      ? "Projects could not be loaded"
                      : "No projects match"}
              </Text>
              <Text className="mt-1 text-center text-[12px] text-slate-500">
                {projectState.loading
                  ? "Fetching repositories and deployment status from Deplo."
                  : projectState.unavailable
                    ? projectState.error ?? "Pull to refresh and try again."
                    : query
                      ? "Try another repository name or clear the search."
                      : "Sync your GitHub repositories to import a project and deploy it."}
              </Text>
              {!projectState.loading && !projectState.unavailable && !query ? <Pressable accessibilityRole="button" onPress={() => void refresh()} className="mt-4 border border-deplo-black bg-deplo-black px-4 py-3"><Text className="font-mono text-[11px] font-bold uppercase text-white">Sync repositories</Text></Pressable> : null}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
