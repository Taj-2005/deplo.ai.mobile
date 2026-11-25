import { Image, Pressable, Text } from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NotFoundScreen() {
  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-[#F6FAFE] px-8">
      <Image source={require("../../assets/icon.png")} resizeMode="contain" className="mb-6 h-12 w-12" />
      <Text className="text-[22px] font-bold text-deplo-black">Page unavailable</Text>
      <Text className="mt-2 text-center text-[13px] leading-5 text-slate-500">
        This route is not available in the current mobile workspace.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => router.replace("/(tabs)")}
        className="mt-6 border border-deplo-black bg-deplo-black px-6 py-3.5"
      >
        <Text className="font-mono text-[12px] font-bold text-white">Return to overview</Text>
      </Pressable>
    </SafeAreaView>
  );
}
