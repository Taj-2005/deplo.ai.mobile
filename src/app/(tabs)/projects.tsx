import { useState } from "react";
import { Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { Boxes, FolderGit2, Lock, Search } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { StatusPill } from "@/components/status-pill";
import { useCachedData } from "@/hooks/use-cached-data";
import { fetchRepositories } from "@/lib/api";
import type { Repository } from "@/lib/deplo-api";

const projects = [
  { name: "storefront", owner: "taj-2005/storefront", branch: "main", private: true, status: "Live", tone: "success" as const },
  { name: "payment-api", owner: "taj-2005/payment-api", branch: "main", private: true, status: "Failed", tone: "danger" as const },
  { name: "deplo-docs", owner: "deplolabs/deplo-docs", branch: "docs", private: false, status: "Preview", tone: "warning" as const },
];

export default function ProjectsScreen() {
  const [query, setQuery] = useState("");
  const repositoryState = useCachedData<Repository[]>(
    "deplo.mobile.projects",
    projects.map((project, index) => ({
      id: ["storefront", "payment-api", "deplo-docs"][index],
      name: project.name,
      fullName: project.owner,
      isPrivate: project.private,
      defaultBranch: project.branch,
      updatedAt: new Date().toISOString(),
      language: "TypeScript",
      description: null,
      url: `https://github.com/${project.owner}`,
    })),
    fetchRepositories,
  );
  const liveProjects = repositoryState.data ?? [];
  const normalizedProjects = liveProjects.map((project) => ({
    name: project.name,
    owner: project.fullName,
    branch: project.defaultBranch,
    private: project.isPrivate,
    status: "Preview",
    tone: "warning" as const,
    id: project.id,
  }));
  const filtered = normalizedProjects.filter((project) =>
    `${project.name} ${project.owner}`.toLowerCase().includes(query.toLowerCase()),
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F6FAFE]" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
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

        <View className="mx-5 border border-slate-200 bg-white">
          {filtered.map((project, index) => (
            <Pressable
              key={project.owner}
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
              </View>
              <StatusPill label={project.status} tone={project.tone} />
            </Pressable>
          ))}

          {filtered.length === 0 ? (
            <View className="items-center px-5 py-10">
              <Text className="text-[14px] font-bold text-deplo-black">No projects match</Text>
              <Text className="mt-1 text-center text-[12px] text-slate-500">
                Try another repository name or clear the search.
              </Text>
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
