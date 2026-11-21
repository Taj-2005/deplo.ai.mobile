import { useState } from "react";
import { Alert, Pressable, Text, View } from "react-native";
import { router } from "expo-router";
import { FolderGit2 } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { setSessionToken } from "@/lib/session";

export default function SignInScreen() {
  const [starting, setStarting] = useState(false);

  function startGitHubSignIn() {
    setStarting(true);
    Alert.alert(
      "GitHub sign-in",
      "OAuth is the next integration phase. No provider secret was stored.",
      [
        {
          text: "Continue",
          onPress: () => {
            void setSessionToken("development-session-placeholder").finally(() => {
              setStarting(false);
              router.replace("/(tabs)");
            });
          },
        },
        {
          text: "Cancel",
          style: "cancel",
          onPress: () => setStarting(false),
        },
      ],
    );
  }

  return (
    <SafeAreaView className="flex-1 justify-center bg-white px-5">
      <View className="mb-8 h-14 w-14 items-center justify-center rounded-full bg-deplo-black">
        <Text className="text-2xl font-bold text-white">D</Text>
      </View>
      <Text className="text-[30px] font-bold tracking-tight text-deplo-black">
        Sign in to Deplo
      </Text>
      <Text className="mt-3 text-[14px] leading-6 text-slate-600">
        Keep deployment health and failure recovery available on this phone.
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sign in with GitHub"
        disabled={starting}
        onPress={startGitHubSignIn}
        className="mt-8 flex-row items-center justify-center gap-3 border border-deplo-black bg-deplo-black px-4 py-4"
      >
        <FolderGit2 size={18} strokeWidth={1.8} className="text-white" />
        <Text className="font-mono text-[13px] font-bold text-white">
          {starting ? "Starting…" : "Continue with GitHub"}
        </Text>
      </Pressable>
      <Text className="mt-4 text-center font-mono text-[10px] leading-4 text-slate-400">
        Your session is stored in the device secure enclave or keystore.
      </Text>
    </SafeAreaView>
  );
}
