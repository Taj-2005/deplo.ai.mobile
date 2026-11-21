import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-1 items-center justify-center px-8">
        <View className="mb-6 h-14 w-14 items-center justify-center rounded-full bg-deplo-black">
          <Text className="text-2xl font-bold text-white">D</Text>
        </View>
        <Text className="text-center font-mono text-3xl font-bold tracking-tight text-deplo-black">
          deplo<Text className="text-deplo-slate">.ai</Text>
        </Text>
        <Text className="mt-3 max-w-sm text-center text-base leading-6 text-deplo-slate">
          AI-powered deployment orchestration.
        </Text>
        <View className="mt-8 border border-deplo-border bg-slate-50 px-5 py-3">
          <Text className="font-mono text-xs uppercase tracking-widest text-deplo-slate">
            Mobile workspace ready
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
