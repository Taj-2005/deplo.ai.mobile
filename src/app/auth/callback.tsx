import { useEffect, useState } from "react";
import { Pressable, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { setSessionToken } from "@/lib/session";

export default function AuthCallbackScreen() {
  const params = useLocalSearchParams<{ token?: string; error?: string; auth?: string }>();
  const [message, setMessage] = useState("Completing GitHub sign-in");

  useEffect(() => {
    let cancelled = false;
    const complete = async () => {
      if (params.error || params.auth === "failed") {
        if (!cancelled) setMessage(params.error || "GitHub sign-in failed. Please try again.");
        return;
      }
      if (!params.token) {
        if (!cancelled) setMessage("The sign-in callback did not include a session token.");
        return;
      }

      await setSessionToken(params.token);
      if (!cancelled) router.replace("/onboarding");
    };
    const timer = setTimeout(() => void complete(), 0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [params.auth, params.error, params.token]);

  const hasFailure = !!params.error || params.auth === "failed" || !params.token;

  return (
    <SafeAreaView className="flex-1 items-center justify-center bg-white px-8">
      <View className="mb-6 h-12 w-12 items-center justify-center rounded-full bg-deplo-black">
        <Text className="text-xl font-bold text-white">D</Text>
      </View>
      <Text className="text-center text-[18px] font-bold text-deplo-black">{message}</Text>
      {hasFailure ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace("/auth/sign-in")}
          className="mt-6 border border-deplo-black bg-deplo-black px-6 py-3.5"
        >
          <Text className="font-mono text-[12px] font-bold text-white">Try again</Text>
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}
