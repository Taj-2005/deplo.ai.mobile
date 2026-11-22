import { useEffect, useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, Eye, EyeOff, KeyRound } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getDeployment } from "@/lib/mobile-data";
import { fetchDeployment, provideDeploymentEnv } from "@/lib/api";
import { isDemoMode } from "@/lib/app-config";

export default function DeploymentEnvironmentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [requiredKeys, setRequiredKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      const load = async () => {
        try {
          const keys = isDemoMode
            ? getDeployment(id)?.requiredEnvVars ?? []
            : (await fetchDeployment(id)).envVariables
              .filter((item) => item.isRequired)
              .map((item) => item.key);
          if (cancelled) return;
          setRequiredKeys(keys);
          setValues(Object.fromEntries(keys.map((key) => [key, ""])));
          setLoadError(null);
        } catch (error) {
          if (!cancelled) setLoadError(error instanceof Error ? error.message : "Deployment details could not be loaded.");
        } finally {
          if (!cancelled) setLoading(false);
        }
      };
      void load();
    }, 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [id]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-[#F6FAFE] px-8">
        <Text className="text-[14px] text-slate-600">Loading required environment keys…</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F6FAFE]" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
        <View className="px-5 pb-5 pt-3">
          <Pressable
            accessibilityRole="button"
            onPress={() => router.back()}
            className="mb-5 h-9 w-9 items-center justify-center border border-slate-200 bg-white"
          >
            <ArrowLeft size={17} strokeWidth={1.8} className="text-slate-600" />
          </Pressable>
          <View className="flex-row items-center gap-3">
            <View className="h-10 w-10 items-center justify-center border border-amber-200 bg-amber-50">
              <KeyRound size={17} strokeWidth={1.8} className="text-amber-700" />
            </View>
            <View className="flex-1">
              <Text className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Deployment paused
              </Text>
              <Text className="mt-1 text-[24px] font-bold tracking-tight text-deplo-black">
                Environment values
              </Text>
            </View>
          </View>
          <Text className="mt-3 text-[13px] leading-5 text-slate-600">
            Provide required values before this deployment can continue. Values are sent securely
            to Deplo and are never retained in the mobile preference cache.
          </Text>
        </View>

        {loadError ? (
          <View className="mx-5 mb-4 border border-red-200 bg-red-50 p-4">
            <Text className="text-[12px] leading-5 text-red-800">{loadError}</Text>
          </View>
        ) : null}

        <View className="mx-5 border border-slate-200 bg-white">
          {Object.keys(values).map((key, index) => (
            <View
              key={key}
              className={`p-4 ${index > 0 ? "border-t border-slate-200" : ""}`}
            >
              <Text className="mb-2 font-mono text-[11px] font-bold text-deplo-black">
                {key}
                <Text className="text-red-600"> required</Text>
              </Text>
              <View className="flex-row items-center border border-slate-200 bg-slate-50">
                <TextInput
                  value={values[key]}
                  onChangeText={(value) => setValues((current) => ({ ...current, [key]: value }))}
                  secureTextEntry={!revealed[key]}
                  placeholder="Enter value"
                  placeholderTextColor="#94A3B8"
                  className="flex-1 px-3 py-3 font-mono text-[12px] text-deplo-black"
                />
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setRevealed((current) => ({
                    ...current,
                    [key]: !current[key],
                  }))}
                  className="px-3"
                >
                  {revealed[key] ? (
                    <EyeOff size={15} strokeWidth={1.7} className="text-slate-500" />
                  ) : (
                    <Eye size={15} strokeWidth={1.7} className="text-slate-500" />
                  )}
                </Pressable>
              </View>
            </View>
          ))}
          {requiredKeys.length === 0 ? (
            <View className="p-4">
              <Text className="text-[13px] text-slate-600">No required environment keys were returned for this deployment.</Text>
            </View>
          ) : null}
        </View>

        <Pressable
          accessibilityRole="button"
          disabled={!!loadError || requiredKeys.length === 0}
          onPress={async () => {
            const missing = Object.entries(values).filter(([, value]) => !value.trim());
            if (missing.length) {
              Alert.alert("Required values missing", "Complete all required environment fields.");
              return;
            }
            try {
              if (isDemoMode) {
                Alert.alert("Demo mode", "Environment values were not sent to a server.");
                router.replace(`/deployments/${id}`);
                return;
              }
              const result = await provideDeploymentEnv(
                id,
                Object.entries(values).map(([key, value]) => ({ key, value })),
              );
              Alert.alert("Environment submitted", `Deployment resumed with status ${result.status}.`);
              router.replace(`/deployments/${result.deploymentId}`);
            } catch (error) {
              Alert.alert(
                "Submission failed",
                error instanceof Error ? error.message : "Environment values could not be submitted.",
              );
            }
          }}
          className="mx-5 mt-5 items-center border border-deplo-black bg-deplo-black px-4 py-4"
        >
          <Text className="font-mono text-[13px] font-bold text-white">
            {requiredKeys.length === 0 ? "No required values" : "Continue deployment"}
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
