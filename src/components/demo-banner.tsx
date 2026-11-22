import { Text, View } from "react-native";
import { isDemoMode } from "@/lib/app-config";

export function DemoBanner() {
  if (!isDemoMode) return null;
  return (
    <View className="mx-5 mb-5 border border-violet-200 bg-violet-50 px-4 py-3">
      <Text className="font-mono text-[10px] font-bold uppercase tracking-widest text-violet-700">
        Demo mode
      </Text>
      <Text className="mt-1 text-[11px] leading-4 text-violet-700">
        This build uses local fixture data. Backend connections are not represented as live.
      </Text>
    </View>
  );
}
