import { Alert, Pressable, ScrollView, Switch, Text, View } from "react-native";
import { ChevronRight, Fingerprint, LogOut, Smartphone } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";
import { useEffect, useState } from "react";
import { router } from "expo-router";
import { clearSession, getBiometricPreference, setBiometricPreference } from "@/lib/session";
import { authenticateForAppResume, getBiometricStatus } from "@/lib/biometrics";
import { clearPushRegistration, registerDeviceForPush } from "@/lib/notifications";
import {
  loadNotificationPreferences,
  writeNotificationPreferences,
} from "@/lib/notification-preferences";
import { clearDeviceIdentity, getDeviceRegistrationId, getOrCreateDeviceId } from "@/lib/device";
import { fetchMobileDevices, revokeMobileDevice, verifySession, type MobileDevice } from "@/lib/api";
import { isDemoMode } from "@/lib/app-config";

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
  const [account, setAccount] = useState<{
    name: string;
    email: string;
  } | null>(null);
  const [devices, setDevices] = useState<MobileDevice[] | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);

  useEffect(() => {
    void getOrCreateDeviceId().then(setCurrentDeviceId);
    void getBiometricPreference().then(setBiometric);
    void loadNotificationPreferences().then((preferences) =>
      setNotifications(preferences.enabled),
    );
    if (!isDemoMode) {
      void fetchMobileDevices().then(setDevices).catch(() => setDevices(null));
    }
    void verifySession()
      .then((profile) => setAccount({
        name: profile.name || profile.githubLogin,
        email: profile.email,
      }))
      .catch(() => setAccount(null));
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
    try {
      let registration = null;
      if (enabled) registration = await registerDeviceForPush();
      const preferences = await loadNotificationPreferences();
      preferences.enabled = enabled;
      await writeNotificationPreferences(preferences);
      if (registration) {
        Alert.alert(
          registration.pushToken ? "Push notifications enabled" : "Push notifications unavailable",
          registration.pushToken
            ? `This ${registration.platform} device is registered for Deplo alerts.`
            : "Allow notification permission or use a physical device to complete registration.",
        );
      }
    } catch (error) {
      setNotifications(!enabled);
      Alert.alert(
        "Notification settings not saved",
        error instanceof Error ? error.message : "The server could not update notification settings.",
      );
    }
  }

  function handleSignOut() {
    Alert.alert("Sign out?", "This will end the session and revoke push access.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: () => {
          void Promise.all([getOrCreateDeviceId(), getDeviceRegistrationId()])
            .then(([localId, registrationId]) => revokeMobileDevice(registrationId ?? localId))
            .catch(() => undefined)
            .finally(async () => {
              await clearPushRegistration();
              await clearDeviceIdentity();
              await clearSession();
              router.replace("/auth/sign-in");
            });
        },
      },
    ]);
  }

  function confirmDeviceRevoke(device: MobileDevice) {
    Alert.alert(`Revoke ${device.deviceName}?`, "This device will stop receiving Deplo push notifications.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Revoke device",
        style: "destructive",
        onPress: () => {
          void revokeMobileDevice(device.deviceId)
            .then(async () => {
              setDevices((current) => current?.filter((item) => item.deviceId !== device.deviceId) ?? []);
              if ((await getDeviceRegistrationId()) === device.deviceId) await clearPushRegistration();
            })
            .catch((error) => Alert.alert("Could not revoke device", error instanceof Error ? error.message : "The server could not revoke this device."));
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
            description={devices === null ? "This phone · Registration status" : `${devices.length} registered device${devices.length === 1 ? "" : "s"}`}
            icon={<Smartphone size={16} strokeWidth={1.7} className="text-slate-600" />}
            trailing={<ChevronRight size={16} strokeWidth={1.7} className="text-slate-400" />}
            onPress={() => void registerDeviceForPush()
              .then((registration) => {
                Alert.alert(
                  registration.pushToken ? "Device registered" : "Device registration unavailable",
                  registration.pushToken
                    ? `${registration.deviceName} is registered for push alerts.`
                    : "Allow notification permission or use a physical device.",
                );
                if (!isDemoMode) void fetchMobileDevices().then(setDevices).catch(() => undefined);
              })
              .catch((error) => Alert.alert("Device registration failed", error instanceof Error ? error.message : "The server could not register this device."))}
          />
          <SettingRow
            label="Sign out"
            description="End this session and revoke push access"
            icon={<LogOut size={16} strokeWidth={1.7} className="text-red-600" />}
            trailing={<ChevronRight size={16} strokeWidth={1.7} className="text-slate-400" />}
            onPress={handleSignOut}
          />
        </View>

        {!isDemoMode && devices?.length ? (
          <View className="mx-5 mt-5 border border-slate-200 bg-white">
            <Text className="border-b border-slate-200 px-4 py-3 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Registered devices
            </Text>
            {devices.map((device, index) => (
              <View key={device.deviceId} className={`flex-row items-center gap-3 px-4 py-3 ${index > 0 ? "border-t border-slate-100" : ""}`}>
                <View className="flex-1">
                  <Text className="text-[12px] font-bold text-deplo-black">{device.deviceName}{device.deviceId === currentDeviceId ? " · This device" : ""}</Text>
                  <Text className="mt-0.5 font-mono text-[10px] uppercase text-slate-500">{device.platform}</Text>
                </View>
                <Pressable accessibilityRole="button" onPress={() => confirmDeviceRevoke(device)} className="border border-red-200 px-3 py-2">
                  <Text className="font-mono text-[10px] font-bold uppercase text-red-700">Revoke</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <View className="mx-5 mt-5 border border-slate-200 bg-white p-4">
          <Text className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Account
          </Text>
          <Text className="mt-2 text-[13px] font-bold text-deplo-black">
            {account?.name ?? "Session account"}
          </Text>
          <Text className="mt-0.5 font-mono text-[11px] text-slate-500">
            {account?.email ?? "Verify session to load profile"}
          </Text>
        </View>

        <Text className="mt-6 text-center font-mono text-[10px] text-slate-400">
          DEPLO MOBILE · VERSION 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
