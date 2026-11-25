import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, AppState, Image, Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { ArrowUpRight, Check, ChevronRight, GitBranch, RefreshCw, Server, TriangleAlert } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { connectRender, fetchIntegrations, getVercelInstallUrl, type IntegrationStatus } from "@/lib/api";

const RENDER_API_KEYS = "https://dashboard.render.com/u/settings#api-keys";

export default function OnboardingScreen() {
  const [integrations, setIntegrations] = useState<IntegrationStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [vercelBusy, setVercelBusy] = useState(false);
  const [renderKey, setRenderKey] = useState("");
  const [renderBusy, setRenderBusy] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async (quiet = false) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const rows = await fetchIntegrations();
      setIntegrations(rows);
      const vercelConnected = rows.some((item) => item.provider === "VERCEL" && item.connected);
      const renderConnected = rows.some((item) => item.provider === "RENDER" && item.connected);
      if (vercelConnected && renderConnected) router.replace("/(tabs)");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load provider connections.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    void refresh();
  }, [refresh]));

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refresh(true);
    });
    return () => subscription.remove();
  }, [refresh]);

  const vercel = integrations.find((item) => item.provider === "VERCEL");
  const render = integrations.find((item) => item.provider === "RENDER");

  async function beginVercelConnect() {
    setVercelBusy(true);
    setError("");
    try {
      const url = await getVercelInstallUrl();
      await Linking.openURL(url);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not open Vercel authorization.");
    } finally {
      setVercelBusy(false);
    }
  }

  async function submitRenderKey() {
    const key = renderKey.trim();
    if (!key || renderBusy) return;
    setRenderBusy(true);
    setError("");
    try {
      await connectRender(key);
      setRenderKey("");
      await refresh(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Render could not validate this API key.");
    } finally {
      setRenderBusy(false);
    }
  }

  if (loading) {
    return <SafeAreaView className="flex-1 items-center justify-center bg-white">
      <ActivityIndicator color="#111111" />
      <Text className="mt-3 font-mono text-[11px] uppercase tracking-widest text-slate-500">Loading setup</Text>
    </SafeAreaView>;
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <ScrollView contentContainerClassName="px-5 pb-10 pt-6" keyboardShouldPersistTaps="handled">
        <View className="mb-7 flex-row items-center justify-between">
          <Image source={require("../../assets/icon.png")} resizeMode="contain" className="h-11 w-11" />
          <Pressable accessibilityRole="button" accessibilityLabel="Refresh provider connections" onPress={() => void refresh(true)} className="flex-row items-center gap-2 border border-slate-200 px-3 py-2">
            <RefreshCw size={14} color="#111111" />
            <Text className="font-mono text-[10px] font-bold uppercase text-deplo-black">{refreshing ? "Checking" : "Refresh"}</Text>
          </Pressable>
        </View>

        <Text className="font-mono text-[10px] font-bold uppercase tracking-[2px] text-slate-500">First time setup · 2 connections</Text>
        <Text className="mt-2 text-[29px] font-bold leading-9 tracking-tight text-deplo-black">Welcome to Deplo</Text>
        <Text className="mt-3 text-[14px] leading-6 text-slate-600">Connect the accounts that own your deployments. Deplo uses Vercel for frontends and Render for backends.</Text>

        <View className="mt-7 border border-slate-200 p-4">
          <View className="flex-row items-start gap-3">
            <View className="mt-0.5 h-8 w-8 items-center justify-center bg-slate-100"><GitBranch size={17} color="#111111" /></View>
            <View className="flex-1">
              <Text className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Step 1</Text>
              <Text className="mt-1 text-[16px] font-bold text-deplo-black">GitHub connected</Text>
              <Text className="mt-1 text-[12px] leading-5 text-slate-600">Your repositories are ready to import.</Text>
            </View>
            <Check size={18} color="#16804A" />
          </View>
        </View>

        <View className="mt-3 border border-slate-200 p-4">
          <View className="flex-row items-start gap-3">
            <View className="mt-0.5 h-8 w-8 items-center justify-center bg-slate-100"><Text className="text-sm font-black text-deplo-black">▲</Text></View>
            <View className="flex-1">
              <Text className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Step 2</Text>
              <Text className="mt-1 text-[16px] font-bold text-deplo-black">Connect Vercel</Text>
              <Text className="mt-1 text-[12px] leading-5 text-slate-600">Frontends deploy to your Vercel account.</Text>
              {vercel?.connected ? <Text className="mt-3 font-mono text-[11px] font-bold text-emerald-700">Connected{vercel.accountName ? ` · ${vercel.accountName}` : ""}</Text> : (
                <Pressable accessibilityRole="button" onPress={() => void beginVercelConnect()} disabled={vercelBusy} className="mt-4 flex-row items-center justify-center gap-2 bg-deplo-black px-4 py-3">
                  {vercelBusy ? <ActivityIndicator size="small" color="white" /> : <Text className="font-mono text-[11px] font-bold uppercase text-white">Connect Vercel</Text>}
                  {!vercelBusy && <ChevronRight size={15} color="white" />}
                </Pressable>
              )}
              <Text className="mt-3 text-[11px] leading-4 text-slate-500">Authorize Deplo in Vercel, then return here. Your Vercel password is never shared with Deplo.</Text>
            </View>
          </View>
        </View>

        <View className="mt-3 border border-slate-200 p-4">
          <View className="flex-row items-start gap-3">
            <View className="mt-0.5 h-8 w-8 items-center justify-center bg-slate-100"><Server size={17} color="#111111" /></View>
            <View className="flex-1">
              <Text className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">Step 3</Text>
              <Text className="mt-1 text-[16px] font-bold text-deplo-black">Connect Render</Text>
              <Text className="mt-1 text-[12px] leading-5 text-slate-600">Backends deploy to your Render workspace.</Text>
              {render?.connected ? (
                <Text className="mt-3 font-mono text-[11px] font-bold text-emerald-700">Connected{render.accountName ? ` · ${render.accountName}` : ""}</Text>
              ) : <>
                <Pressable accessibilityRole="link" onPress={() => void Linking.openURL(RENDER_API_KEYS)} className="mt-4 flex-row items-center justify-between border border-slate-200 bg-slate-50 px-3 py-3">
                  <Text className="font-mono text-[11px] font-semibold text-deplo-black">Open Render API Keys</Text><ArrowUpRight size={15} color="#111111" />
                </Pressable>
                <Text className="mt-3 text-[11px] leading-4 text-slate-500">Create a Personal API Key in Render Account Settings → API Keys. Copy it now; Render shows it once. It starts with rnd_.</Text>
                <TextInput
                  accessibilityLabel="Render API key"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setRenderKey}
                  placeholder="rnd_…"
                  placeholderTextColor="#94A3B8"
                  secureTextEntry
                  value={renderKey}
                  className="mt-4 border border-slate-300 px-3 py-3 font-mono text-[12px] text-deplo-black"
                />
                <Pressable accessibilityRole="button" disabled={!renderKey.trim() || renderBusy} onPress={() => void submitRenderKey()} className={`mt-3 flex-row items-center justify-center gap-2 px-4 py-3 ${renderKey.trim() && !renderBusy ? "bg-deplo-black" : "bg-slate-300"}`}>
                  {renderBusy ? <ActivityIndicator size="small" color="white" /> : <Text className="font-mono text-[11px] font-bold uppercase text-white">Validate and connect</Text>}
                </Pressable>
              </>}
            </View>
          </View>
        </View>

        {error ? <View className="mt-4 flex-row items-start gap-2 border border-red-200 bg-red-50 p-3"><TriangleAlert size={16} color="#B91C1C" /><Text className="flex-1 text-[12px] leading-5 text-red-800">{error}</Text></View> : null}
        <Text className="mt-5 text-center text-[11px] leading-5 text-slate-400">Render keys are sent securely, validated, encrypted at rest, and never shown again. Complete both connections to open your dashboard.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}
