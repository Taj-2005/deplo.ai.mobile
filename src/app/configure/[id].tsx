import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Eye, EyeOff, Rocket, TriangleAlert } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { analyzeRepository, fetchRepositories, redeployRepository, type RepositoryAnalysis } from "@/lib/api";
import type { Repository } from "@/lib/deplo-api";

const SENSITIVE = /secret|password|token|key|api|auth|credential|private/i;

export default function ConfigureProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [repo, setRepo] = useState<Repository | null>(null);
  const [analysis, setAnalysis] = useState<RepositoryAnalysis | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [showOptional, setShowOptional] = useState(false);
  const [loading, setLoading] = useState(true);
  const [deploying, setDeploying] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    void Promise.all([fetchRepositories(), analyzeRepository(id)])
      .then(([repositories, result]) => {
        if (!active) return;
        setRepo(repositories.find((item) => item.id === id) ?? null);
        setAnalysis(result);
        setValues(Object.fromEntries(result.envVars.map((item) => [item.key, item.value ?? ""])));
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "Could not analyze this repository."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const required = useMemo(() => analysis?.envVars.filter((item) => item.isRequired) ?? [], [analysis]);
  const optional = useMemo(() => analysis?.envVars.filter((item) => !item.isRequired) ?? [], [analysis]);
  const canDeploy = !!analysis && required.every((item) => (values[item.key] ?? "").trim().length > 0);

  async function deploy() {
    if (!canDeploy || deploying) return;
    setDeploying(true);
    setError("");
    try {
      const envVars = Object.entries(values)
        .filter(([, value]) => value.trim().length > 0)
        .map(([key, value]) => ({ key, value }));
      const result = await redeployRepository(id, envVars);
      router.replace(`/deployments/${result.deploymentId}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not start deployment.");
      setDeploying(false);
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F6FAFE]" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
        <View className="px-5 pb-5 pt-3">
          <Pressable accessibilityRole="button" onPress={() => router.back()} className="mb-5 h-9 w-9 items-center justify-center border border-slate-200 bg-white">
            <ArrowLeft size={17} color="#334155" />
          </Pressable>
          <Text className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Import · Configure · Deploy</Text>
          <Text className="mt-1 text-[28px] font-bold tracking-tight text-deplo-black">Configure project</Text>
          <Text className="mt-2 text-[13px] text-slate-600">{repo?.fullName ?? "Analyzing repository…"}</Text>
        </View>

        <View className="mx-5 border border-slate-200 bg-white p-4">
          <Text className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">Detected stack</Text>
          {loading ? <ActivityIndicator className="mt-4 self-start" color="#111111" /> : (
            <View className="mt-3 gap-2">
              <Text className="text-[13px] text-deplo-black">Frontend · {analysis?.stack.frontend ?? "Not detected"}</Text>
              <Text className="text-[13px] text-deplo-black">Backend · {analysis?.stack.backend ?? "Not detected"}</Text>
              <Text className="text-[11px] text-slate-500">Branch · {analysis?.defaultBranch ?? repo?.defaultBranch ?? "—"}</Text>
            </View>
          )}
        </View>

        {!loading && analysis ? (
          <View className="mx-5 mt-4 border border-slate-200 bg-white p-4">
            <Text className="text-[16px] font-bold text-deplo-black">Environment variables</Text>
            <Text className="mt-1 text-[12px] leading-5 text-slate-500">Required values must be provided before deployment. Secret fields are hidden by default.</Text>
            {required.length === 0 ? <Text className="mt-4 border border-emerald-200 bg-emerald-50 p-3 text-[12px] text-emerald-800">No required variables detected.</Text> : null}
            {required.map((item) => <EnvField key={item.key} name={item.key} required value={values[item.key] ?? ""} hidden={SENSITIVE.test(item.key) && !revealed[item.key]} onReveal={() => setRevealed((current) => ({ ...current, [item.key]: !current[item.key] }))} onChange={(value) => setValues((current) => ({ ...current, [item.key]: value }))} />)}
            {optional.length ? <>
              <Pressable accessibilityRole="button" onPress={() => setShowOptional((current) => !current)} className="mt-5 border-t border-slate-200 pt-4">
                <Text className="font-mono text-[11px] font-bold uppercase text-slate-600">{showOptional ? "Hide" : "Show"} optional variables ({optional.length})</Text>
              </Pressable>
              {showOptional ? optional.map((item) => <EnvField key={item.key} name={item.key} required={false} value={values[item.key] ?? ""} hidden={SENSITIVE.test(item.key) && !revealed[item.key]} onReveal={() => setRevealed((current) => ({ ...current, [item.key]: !current[item.key] }))} onChange={(value) => setValues((current) => ({ ...current, [item.key]: value }))} />) : null}
            </> : null}
          </View>
        ) : null}

        {error ? <View className="mx-5 mt-4 flex-row items-start gap-2 border border-red-200 bg-red-50 p-3"><TriangleAlert size={16} color="#B91C1C" /><Text className="flex-1 text-[12px] leading-5 text-red-800">{error}</Text></View> : null}
        <Pressable accessibilityRole="button" disabled={!canDeploy || deploying} onPress={() => void deploy()} className={`mx-5 mt-5 flex-row items-center justify-center gap-2 px-4 py-4 ${canDeploy && !deploying ? "bg-deplo-black" : "bg-slate-300"}`}>
          {deploying ? <ActivityIndicator size="small" color="white" /> : <Rocket size={16} color="white" />}
          <Text className="font-mono text-[12px] font-bold uppercase text-white">{deploying ? "Starting deployment…" : "Deploy project"}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function EnvField({ name, value, required, hidden, onReveal, onChange }: { name: string; value: string; required: boolean; hidden: boolean; onReveal: () => void; onChange: (value: string) => void }) {
  const secret = SENSITIVE.test(name);
  return (
    <View className="mt-4">
      <View className="mb-1.5 flex-row items-center justify-between">
        <Text className="font-mono text-[11px] font-bold text-deplo-black">{name}{required ? " · REQUIRED" : ""}</Text>
        {secret ? <Pressable accessibilityRole="button" accessibilityLabel={hidden ? `Show ${name}` : `Hide ${name}`} onPress={onReveal}><Text className="font-mono text-[10px] text-slate-500">{hidden ? "Show" : "Hide"}</Text></Pressable> : null}
      </View>
      <View className="flex-row items-center border border-slate-300 px-3">
        <TextInput autoCapitalize="none" autoCorrect={false} onChangeText={onChange} placeholder={required ? "Required" : "Optional"} placeholderTextColor="#94A3B8" secureTextEntry={hidden} value={value} className="min-h-11 flex-1 font-mono text-[12px] text-deplo-black" />
        {secret ? hidden ? <Eye size={14} color="#64748B" /> : <EyeOff size={14} color="#64748B" /> : null}
      </View>
    </View>
  );
}
