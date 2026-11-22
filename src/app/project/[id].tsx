import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, ExternalLink, GitBranch, Globe, Server } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusPill } from "@/components/status-pill";
import { getLatestDeployment, getProject } from "@/lib/mobile-data";

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const project = getProject(id);
  const latestDeployment = getLatestDeployment(id);

  if (!project) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F6FAFE] px-8">
        <Text className="text-[16px] font-bold text-deplo-black">Project unavailable</Text>
        <Pressable onPress={() => router.back()} className="mt-4 border border-slate-200 px-4 py-3">
          <Text className="font-mono text-[12px] text-slate-600">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const tone = project.status === "Live" ? "success" : project.status === "Failed" ? "danger" : "warning";

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
            {project.environment} project
          </Text>
          <View className="mt-1 flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-[30px] font-bold tracking-tight text-deplo-black">
              {project.name}
            </Text>
            <StatusPill
              label={project.status}
              tone={tone as "success" | "danger" | "warning"}
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
          {project.frontendUrl ? (
            <View className="flex-row items-center gap-3 border-b border-slate-200 p-4">
              <Globe size={16} strokeWidth={1.7} className="text-slate-600" />
              <View className="flex-1">
                <Text className="font-mono text-[10px] uppercase text-slate-500">Frontend</Text>
                <Text className="mt-1 text-[12px] text-deplo-black">{project.frontendUrl}</Text>
              </View>
              <ExternalLink size={14} strokeWidth={1.7} className="text-slate-400" />
            </View>
          ) : null}
          {project.backendUrl ? (
            <View className="flex-row items-center gap-3 p-4">
              <Server size={16} strokeWidth={1.7} className="text-slate-600" />
              <View className="flex-1">
                <Text className="font-mono text-[10px] uppercase text-slate-500">Backend</Text>
                <Text className="mt-1 text-[12px] text-deplo-black">{project.backendUrl}</Text>
              </View>
              <ExternalLink size={14} strokeWidth={1.7} className="text-slate-400" />
            </View>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => latestDeployment
            ? router.push(`/deployments/${latestDeployment.id}`)
            : undefined}
          disabled={!latestDeployment}
          className="mx-5 mt-5 items-center border border-deplo-black bg-deplo-black px-4 py-4"
        >
          <Text className="font-mono text-[13px] font-bold text-white">View latest deployment</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push(`/monitoring/${id}`)}
          className="mx-5 mt-3 items-center border border-slate-300 bg-white px-4 py-4"
        >
          <Text className="font-mono text-[13px] font-bold text-slate-700">Open monitoring</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
