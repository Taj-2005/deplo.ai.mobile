import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { ChevronRight, Fingerprint, LogOut, Smartphone } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { clearSession, getBiometricPreference, setBiometricPreference } from "@/lib/session";
import { authenticateForAppResume, getBiometricStatus } from "@/lib/biometrics";
import { registerDeviceForPush } from "@/lib/notifications";
import {
  readNotificationPreferences,
  writeNotificationPreferences,
} from "@/lib/notification-preferences";
import { clearDeviceIdentity, getOrCreateDeviceId } from "@/lib/device";
import { revokeMobileDevice } from "@/lib/api";

function SettingRow({
  label,
  description,
  icon,
  trailing,
  onPress,
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  trailing?: React.ReactNode;
  onPress?: () => void;
}) {
  const content = (
    <>
      <View className="h-9 w-9 items-center justify-center border border-slate-200 bg-slate-50">
        {icon}
      </View>
      <View className="flex-1">
        <Text className="text-[13px] font-bold text-deplo-black">{label}</Text>
        <Text className="mt-0.5 text-[11px] leading-4 text-slate-500">{description}</Text>
      </View>
      {trailing}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-4"
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View className="flex-row items-center gap-3 border-b border-slate-200 px-4 py-4 last:border-b-0">
      {content}
    </View>
  );
}

export default function SettingsScreen() {
  const [biometric, setBiometric] = useState(true);
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    void getBiometricPreference().then(setBiometric);
    void readNotificationPreferences().then((preferences) =>
      setNotifications(preferences.enabled),
    );
  }, []);

  async function handleBiometricChange(enabled: boolean) {
    if (enabled) {
      const status = await getBiometricStatus();
      if (!status.compatible || !status.enrolled) {
        Alert.alert(
          "Biometric lock unavailable",
          "Set up Face ID, Touch ID, or fingerprint unlocking on this device first.",
        );
        return;
      }
      const authenticated = await authenticateForAppResume();
      if (!authenticated) return;
    }
    setBiometric(enabled);
    await setBiometricPreference(enabled);
  }

  async function handlePushChange(enabled: boolean) {
    setNotifications(enabled);
    const preferences = await readNotificationPreferences();
    preferences.enabled = enabled;
    await writeNotificationPreferences(preferences);
    if (!enabled) return;

    const registration = await registerDeviceForPush();
    Alert.alert(
      registration.pushToken ? "Push notifications enabled" : "Push notifications unavailable",
      registration.pushToken
        ? `This ${registration.platform} device is registered for Deplo alerts.`
        : "Allow notification permission or use a physical device to complete registration.",
    );
  }

  function handleSignOut() {
    Alert.alert("Sign out?", "This will end the session and revoke push access.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void getOrCreateDeviceId()
            .then((deviceId) => revokeMobileDevice(deviceId))
            .catch(() => undefined)
            .finally(async () => {
              await clearDeviceIdentity();
              await clearSession();
              router.replace("/auth/sign-in");
            });
        },
      },
    ]);
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F6FAFE]" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="Account"
          title="Settings"
          description="Manage this device, security, and alert preferences."
        />

        <View className="mx-5 border border-slate-200 bg-white">
          <SettingRow
            label="Push notifications"
            description="Deployment and uptime alerts"
            icon={<Smartphone size={16} strokeWidth={1.7} className="text-slate-600" />}
            trailing={
              <Switch
                value={notifications}
                onValueChange={(enabled) => void handlePushChange(enabled)}
                trackColor={{ false: "#CBD5E1", true: "#171C1F" }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingRow
            label="Biometric lock"
            description="Require Face ID or fingerprint after resume"
            icon={<Fingerprint size={16} strokeWidth={1.7} className="text-slate-600" />}
            trailing={
              <Switch
                value={biometric}
                onValueChange={(enabled) => void handleBiometricChange(enabled)}
                trackColor={{ false: "#CBD5E1", true: "#171C1F" }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingRow
            label="Device registration"
            description="This phone · Trusted"
            icon={<Smartphone size={16} strokeWidth={1.7} className="text-slate-600" />}
            trailing={<ChevronRight size={16} strokeWidth={1.7} className="text-slate-400" />}
            onPress={() => void registerDeviceForPush().then((registration) => {
              Alert.alert(
                registration.pushToken ? "Device registered" : "Device registration unavailable",
                registration.pushToken
                  ? `${registration.deviceName} is registered for push alerts.`
                  : "Allow notification permission or use a physical device.",
              );
            })}
          />
          <SettingRow
            label="Sign out"
            description="End this session and revoke push access"
            icon={<LogOut size={16} strokeWidth={1.7} className="text-red-600" />}
            trailing={<ChevronRight size={16} strokeWidth={1.7} className="text-slate-400" />}
            onPress={handleSignOut}
          />
        </View>

        <View className="mx-5 mt-5 border border-slate-200 bg-white p-4">
          <Text className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Account
          </Text>
          <Text className="mt-2 text-[13px] font-bold text-deplo-black">Taj</Text>
          <Text className="mt-0.5 font-mono text-[11px] text-slate-500">taj@example.com</Text>
        </View>

        <Text className="mt-6 text-center font-mono text-[10px] text-slate-400">
          DEPLO MOBILE · VERSION 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
