import { useMemo, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { AlertTriangle, ArrowLeft, Copy, ExternalLink, RefreshCw, RotateCcw } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActionSheet } from "@/components/action-sheet";
import { StatusPill } from "@/components/status-pill";
import { deploymentLogs, getDeployment } from "@/lib/mobile-data";

export default function DeploymentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const deployment = getDeployment(id);
  const [stage, setStage] = useState<"All" | "Install" | "Build" | "Deploy">("All");
  const [retryVisible, setRetryVisible] = useState(false);
  const [redeployVisible, setRedeployVisible] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);

  const logs = useMemo(
    () => (deploymentLogs[deployment?.id ?? ""] ?? []).filter(
      (line) => stage === "All" || line.stage === stage,
    ),
    [deployment?.id, stage],
  );

  if (!deployment) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F6FAFE] px-8">
        <Text className="text-[16px] font-bold text-deplo-black">Deployment unavailable</Text>
        <Pressable onPress={() => router.back()} className="mt-4 border border-slate-200 px-4 py-3">
          <Text className="font-mono text-[12px] text-slate-600">Go back</Text>
        </Pressable>
      </SafeAreaView>
    );
  }

  const tone =
    deployment.status === "COMPLETED"
      ? "success"
      : deployment.status === "FAILED"
        ? "danger"
        : "warning";

  function confirmRetry() {
    setRetryVisible(false);
    setActionResult("Retry requested. Deployment status will refresh automatically.");
  }

  function confirmRedeploy() {
    if (!deployment) return;
    setRedeployVisible(false);
    setActionResult("Redeploy requested for commit " + deployment.commit + ".");
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F6FAFE]" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        <View className="px-5 pb-5 pt-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="mb-5 h-9 w-9 items-center justify-center border border-slate-200 bg-white"
          >
            <ArrowLeft size={17} strokeWidth={1.8} className="text-slate-600" />
          </Pressable>
          <Text className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
            Deployment / {deployment.id}
          </Text>
          <View className="mt-1 flex-row items-start justify-between gap-3">
            <Text className="flex-1 text-[28px] font-bold tracking-tight text-deplo-black">
              {deployment.projectName}
            </Text>
            <StatusPill
              label={deployment.status}
              tone={tone as "success" | "danger" | "warning"}
            />
          </View>
          <Text className="mt-2 font-mono text-[11px] text-slate-500">
            {deployment.repository} · {deployment.branch} · {deployment.commit}
          </Text>
        </View>

        {deployment.firstError ? (
          <View className="mx-5 mb-5 border border-red-200 bg-red-50 p-4">
            <View className="flex-row items-center gap-2">
              <AlertTriangle size={16} strokeWidth={1.8} className="text-red-700" />
              <Text className="text-[13px] font-bold text-red-800">First error</Text>
            </View>
            <Text className="mt-2 font-mono text-[12px] leading-5 text-red-700">
              {deployment.firstError}
            </Text>
          </View>
        ) : null}

        {actionResult ? (
          <View className="mx-5 mb-5 border border-green-200 bg-green-50 p-4">
            <Text className="text-[12px] leading-5 text-green-800">{actionResult}</Text>
          </View>
        ) : null}

        <View className="mx-5 flex-row gap-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => setRetryVisible(true)}
            className="flex-1 flex-row items-center justify-center gap-2 border border-deplo-black bg-deplo-black py-3.5"
          >
            <RefreshCw size={14} strokeWidth={1.8} className="text-white" />
            <Text className="font-mono text-[12px] font-bold text-white">Retry</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setRedeployVisible(true)}
            className="flex-1 flex-row items-center justify-center gap-2 border border-slate-300 bg-white py-3.5"
          >
            <RotateCcw size={14} strokeWidth={1.8} className="text-slate-600" />
            <Text className="font-mono text-[12px] font-bold text-slate-700">Redeploy</Text>
          </Pressable>
        </View>

        {deployment.frontendUrl || deployment.backendUrl ? (
          <View className="mx-5 mt-5 border border-slate-200 bg-white">
            {deployment.frontendUrl ? (
              <View className="flex-row items-center gap-3 border-b border-slate-200 p-4">
                <View className="h-2 w-2 rounded-full bg-green-500" />
                <Text className="flex-1 text-[12px] text-deplo-black">{deployment.frontendUrl}</Text>
                <ExternalLink size={14} strokeWidth={1.7} className="text-slate-400" />
              </View>
            ) : null}
            {deployment.backendUrl ? (
              <View className="flex-row items-center gap-3 p-4">
                <View className="h-2 w-2 rounded-full bg-green-500" />
                <Text className="flex-1 text-[12px] text-deplo-black">{deployment.backendUrl}</Text>
                <ExternalLink size={14} strokeWidth={1.7} className="text-slate-400" />
              </View>
            ) : null}
          </View>
        ) : null}

        <View className="mx-5 mt-7">
          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-[15px] font-bold text-deplo-black">Build log</Text>
            <Pressable accessibilityRole="button" className="flex-row items-center gap-1">
              <Copy size={12} strokeWidth={1.7} className="text-slate-500" />
              <Text className="font-mono text-[11px] text-slate-500">Copy</Text>
            </Pressable>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingBottom: 10 }}
          >
            {(["All", "Install", "Build", "Deploy"] as const).map((filter) => (
              <Pressable
                key={filter}
                accessibilityRole="button"
                onPress={() => setStage(filter)}
                className={`border px-3 py-2 ${
                  stage === filter
                    ? "border-deplo-black bg-deplo-black"
                    : "border-slate-200 bg-white"
                }`}
              >
                <Text
                  className={`font-mono text-[11px] ${
                    stage === filter ? "text-white" : "text-slate-600"
                  }`}
                >
                  {filter}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          <View className="border border-slate-800 bg-[#0D1117] p-3">
            {logs.map((line) => (
              <View key={line.id} className="mb-2 flex-row">
                <Text className="w-[52px] font-mono text-[10px] text-slate-500">
                  {line.timestamp}
                </Text>
                <Text
                  className={`flex-1 font-mono text-[11px] leading-5 ${
                    line.level === "error"
                      ? "text-red-400"
                      : line.level === "warn"
                        ? "text-amber-300"
                        : "text-slate-300"
                  }`}
                >
                  {line.message}
                </Text>
              </View>
            ))}
            {logs.length === 0 ? (
              <Text className="py-4 text-center font-mono text-[11px] text-slate-500">
                No log lines for this stage.
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>

      <ActionSheet
        visible={retryVisible}
        title="Retry deployment?"
        description={`Run deployment ${deployment.id} again with the same commit and environment configuration.`}
        confirmLabel="Retry deployment"
        onCancel={() => setRetryVisible(false)}
        onConfirm={confirmRetry}
      />
      <ActionSheet
        visible={redeployVisible}
        title="Redeploy project?"
        description={`Create a new deployment for ${deployment.repository} at commit ${deployment.commit}. This changes production state.`}
        confirmLabel="Redeploy project"
        destructive
        onCancel={() => setRedeployVisible(false)}
        onConfirm={confirmRedeploy}
      />
    </SafeAreaView>
  );
}
