import { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Linking,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  ChevronRight,
  Fingerprint,
  LogOut,
  Server,
  Smartphone,
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useFocusEffect } from "expo-router";
import { ScreenHeader } from "@/components/screen-header";
import { StatusPill } from "@/components/status-pill";
import { UserAvatar } from "@/components/user-avatar";
import { useAppAlert } from "@/components/app-alert";
import { clearSession, getBiometricPreference, setBiometricPreference } from "@/lib/session";
import { authenticateForAppResume, getBiometricStatus } from "@/lib/biometrics";
import { clearPushRegistration, registerDeviceForPush } from "@/lib/notifications";
import {
  loadNotificationPreferences,
  writeNotificationPreferences,
} from "@/lib/notification-preferences";
import { clearDeviceIdentity, getDeviceRegistrationId, getOrCreateDeviceId } from "@/lib/device";
import {
  connectRender,
  disconnectRender,
  disconnectVercel,
  fetchIntegrations,
  fetchMobileDevices,
  getVercelInstallUrl,
  revokeMobileDevice,
  verifySession,
  type IntegrationStatus,
  type MobileDevice,
} from "@/lib/api";
import { isDemoMode } from "@/lib/app-config";

const RENDER_API_KEYS_URL = "https://dashboard.render.com/u/settings#api-keys";
const GITHUB_INSTALLATIONS_URL = "https://github.com/settings/installations";

const demoIntegrations: IntegrationStatus[] = [
  { provider: "VERCEL", connected: true, accountName: "taj-2005", teamName: null, teamId: null, connectedAt: null },
  { provider: "RENDER", connected: true, accountName: "deplo-workspace", teamName: null, teamId: null, connectedAt: null },
];

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

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text className="mx-5 mb-2 mt-6 font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
      {children}
    </Text>
  );
}

function ProviderCard({
  name,
  description,
  logo,
  integration,
  busy,
  onConnect,
  onDisconnect,
  manageUrl,
}: {
  name: string;
  description: string;
  logo: React.ReactNode;
  integration: IntegrationStatus | undefined;
  busy: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  manageUrl: string;
}) {
  const connected = integration?.connected ?? false;

  return (
    <View className="border-b border-slate-200 p-4 last:border-b-0">
      <View className="flex-row items-start gap-3">
        <View className="h-9 w-9 items-center justify-center border border-slate-200 bg-slate-50">
          {logo}
        </View>
        <View className="flex-1">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="text-[13px] font-bold text-deplo-black">{name}</Text>
            <StatusPill label={connected ? "Connected" : "Not connected"} tone={connected ? "success" : "neutral"} />
          </View>
          <Text className="mt-0.5 text-[11px] leading-4 text-slate-500">{description}</Text>
          {connected && integration?.accountName ? (
            <Text className="mt-2 font-mono text-[11px] text-slate-600">
              {integration.accountName}
              {integration.teamName && integration.teamName !== integration.accountName
                ? ` · ${integration.teamName}`
                : ""}
            </Text>
          ) : null}

          <View className="mt-3 flex-row items-center gap-2">
            {connected ? (
              <>
                <Pressable
                  accessibilityRole="link"
                  onPress={() => void Linking.openURL(manageUrl)}
                  className="border border-slate-200 px-3 py-2"
                >
                  <Text className="font-mono text-[10px] font-bold uppercase text-slate-600">Manage</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  disabled={busy}
                  onPress={onDisconnect}
                  className="border border-red-200 px-3 py-2"
                >
                  {busy ? (
                    <ActivityIndicator size="small" color="#B91C1C" />
                  ) : (
                    <Text className="font-mono text-[10px] font-bold uppercase text-red-700">Disconnect</Text>
                  )}
                </Pressable>
              </>
            ) : (
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={onConnect}
                className="flex-row items-center gap-2 bg-deplo-black px-3 py-2"
              >
                {busy ? <ActivityIndicator size="small" color="#FFFFFF" /> : null}
                <Text className="font-mono text-[10px] font-bold uppercase text-white">
                  {busy ? "Connecting" : `Connect ${name}`}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const appAlert = useAppAlert();
  const [biometric, setBiometric] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [account, setAccount] = useState<{
    userId: string;
    name: string;
    email: string;
    githubLogin: string;
    avatarUrl: string | null;
  } | null>(null);
  const [devices, setDevices] = useState<MobileDevice[] | null>(null);
  const [currentDeviceId, setCurrentDeviceId] = useState<string | null>(null);

  const [integrations, setIntegrations] = useState<IntegrationStatus[] | null>(isDemoMode ? demoIntegrations : null);
  const [integrationsError, setIntegrationsError] = useState("");
  const [vercelBusy, setVercelBusy] = useState(false);
  const [renderBusy, setRenderBusy] = useState(false);
  const [renderPanelOpen, setRenderPanelOpen] = useState(false);
  const [renderKey, setRenderKey] = useState("");

  const loadIntegrations = useCallback(async () => {
    if (isDemoMode) {
      setIntegrations(demoIntegrations);
      return;
    }
    try {
      const rows = await fetchIntegrations();
      setIntegrations(rows);
      setIntegrationsError("");
    } catch (error) {
      setIntegrationsError(error instanceof Error ? error.message : "Could not load provider connections.");
    }
  }, []);

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
        userId: profile.userId,
        name: profile.name || profile.githubLogin,
        email: profile.email,
        githubLogin: profile.githubLogin,
        avatarUrl: profile.avatarUrl,
      }))
      .catch(() => setAccount(null));
  }, []);

  useFocusEffect(useCallback(() => {
    void loadIntegrations();
  }, [loadIntegrations]));

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void loadIntegrations();
    });
    return () => subscription.remove();
  }, [loadIntegrations]);

  const vercel = integrations?.find((item) => item.provider === "VERCEL");
  const render = integrations?.find((item) => item.provider === "RENDER");

  async function handleBiometricChange(enabled: boolean) {
    if (enabled) {
      const status = await getBiometricStatus();
      if (!status.compatible || !status.enrolled) {
        void appAlert.notify(
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
        void appAlert.notify(
          registration.pushToken ? "Push notifications enabled" : "Push notifications unavailable",
          registration.pushToken
            ? `This ${registration.platform} device is registered for Deplo alerts.`
            : "Allow notification permission, use a physical device, or check that push is configured for this build.",
        );
      }
    } catch (error) {
      setNotifications(!enabled);
      void appAlert.notify(
        "Notification settings not saved",
        error instanceof Error ? error.message : "The server could not update notification settings.",
      );
    }
  }

  async function handleSignOut() {
    const confirmed = await appAlert.confirm({
      title: "Sign out?",
      description: "This will end the session and revoke push access.",
      confirmLabel: "Sign out",
      destructive: true,
    });
    if (!confirmed) return;
    await Promise.all([getOrCreateDeviceId(), getDeviceRegistrationId()])
      .then(([localId, registrationId]) => revokeMobileDevice(registrationId ?? localId))
      .catch(() => undefined)
      .finally(async () => {
        await clearPushRegistration();
        await clearDeviceIdentity();
        await clearSession();
        router.replace("/auth/sign-in");
      });
  }

  async function confirmDeviceRevoke(device: MobileDevice) {
    const confirmed = await appAlert.confirm({
      title: `Revoke ${device.deviceName}?`,
      description: "This device will stop receiving Deplo push notifications.",
      confirmLabel: "Revoke device",
      destructive: true,
    });
    if (!confirmed) return;
    try {
      await revokeMobileDevice(device.deviceId);
      setDevices((current) => current?.filter((item) => item.deviceId !== device.deviceId) ?? []);
      if ((await getDeviceRegistrationId()) === device.deviceId) await clearPushRegistration();
    } catch (error) {
      void appAlert.notify(
        "Could not revoke device",
        error instanceof Error ? error.message : "The server could not revoke this device.",
      );
    }
  }

  async function beginVercelConnect() {
    if (isDemoMode) return;
    setVercelBusy(true);
    try {
      const url = await getVercelInstallUrl("integrations");
      await Linking.openURL(url);
    } catch (error) {
      void appAlert.notify("Could not open Vercel", error instanceof Error ? error.message : "Try again in a moment.");
    } finally {
      setVercelBusy(false);
    }
  }

  async function confirmVercelDisconnect() {
    const confirmed = await appAlert.confirm({
      title: "Disconnect Vercel?",
      description: "Deplo loses access to your Vercel account. Already-deployed projects keep running.",
      confirmLabel: "Disconnect",
      destructive: true,
    });
    if (!confirmed) return;
    setVercelBusy(true);
    try {
      await disconnectVercel();
      await loadIntegrations();
    } catch (error) {
      void appAlert.notify("Could not disconnect Vercel", error instanceof Error ? error.message : "Try again.");
    } finally {
      setVercelBusy(false);
    }
  }

  function openRenderPanel() {
    setRenderKey("");
    setRenderPanelOpen(true);
  }

  async function submitRenderKey() {
    const key = renderKey.trim();
    if (!key || renderBusy) return;
    setRenderBusy(true);
    try {
      await connectRender(key);
      setRenderKey("");
      setRenderPanelOpen(false);
      await loadIntegrations();
    } catch (error) {
      void appAlert.notify("Render could not validate this key", error instanceof Error ? error.message : "Check the key and try again.");
    } finally {
      setRenderBusy(false);
    }
  }

  async function confirmRenderDisconnect() {
    const confirmed = await appAlert.confirm({
      title: "Disconnect Render?",
      description: "Deplo loses access to your Render workspace. Already-deployed services keep running.",
      confirmLabel: "Disconnect",
      destructive: true,
    });
    if (!confirmed) return;
    setRenderBusy(true);
    try {
      await disconnectRender();
      await loadIntegrations();
    } catch (error) {
      void appAlert.notify("Could not disconnect Render", error instanceof Error ? error.message : "Try again.");
    } finally {
      setRenderBusy(false);
    }
  }

  async function handleDeviceRegistrationPress() {
    try {
      const registration = await registerDeviceForPush();
      void appAlert.notify(
        registration.pushToken ? "Device registered" : "Device registration unavailable",
        registration.pushToken
          ? `${registration.deviceName} is registered for push alerts.`
          : "Allow notification permission, use a physical device, or check that push is configured for this build.",
      );
      if (!isDemoMode) void fetchMobileDevices().then(setDevices).catch(() => undefined);
    } catch (error) {
      void appAlert.notify(
        "Device registration failed",
        error instanceof Error ? error.message : "The server could not register this device.",
      );
    }
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F6FAFE]" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="Account"
          title="Profile"
          description="Your identity, deployment providers, and device settings."
        />

        <View className="mx-5 flex-row items-center gap-3 border border-slate-200 bg-white p-4">
          <UserAvatar avatarUrl={account?.avatarUrl} name={account?.name} size={48} />
          <View className="flex-1">
            <Text className="text-[15px] font-bold text-deplo-black">
              {account?.name ?? "Session account"}
            </Text>
            <Text className="mt-0.5 font-mono text-[11px] text-slate-500">
              {account?.githubLogin ? `@${account.githubLogin}` : account?.email ?? "Verify session to load profile"}
            </Text>
            {account?.email ? (
              <Text className="mt-0.5 text-[11px] text-slate-400">{account.email}</Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="link"
            onPress={() => void Linking.openURL(GITHUB_INSTALLATIONS_URL)}
            className="border border-slate-200 p-2"
          >
            <ChevronRight size={16} strokeWidth={1.8} className="text-slate-400" />
          </Pressable>
        </View>

        <SectionLabel>Deployment providers</SectionLabel>
        <View className="mx-5 border border-slate-200 bg-white">
          <ProviderCard
            name="Vercel"
            description="Your frontends deploy into this account."
            logo={<Text className="text-sm font-black text-deplo-black">▲</Text>}
            integration={vercel}
            busy={vercelBusy}
            onConnect={() => void beginVercelConnect()}
            onDisconnect={() => void confirmVercelDisconnect()}
            manageUrl="https://vercel.com/dashboard"
          />
          <ProviderCard
            name="Render"
            description="Your backends deploy into this workspace."
            logo={<Server size={16} strokeWidth={1.7} className="text-slate-600" />}
            integration={render}
            busy={renderBusy}
            onConnect={openRenderPanel}
            onDisconnect={() => void confirmRenderDisconnect()}
            manageUrl="https://dashboard.render.com"
          />
          {render?.connected ? (
            <View className="border-t border-slate-100 px-4 py-3">
              <Pressable accessibilityRole="button" onPress={openRenderPanel}>
                <Text className="font-mono text-[10px] font-bold uppercase text-slate-500">Rotate Render key</Text>
              </Pressable>
            </View>
          ) : null}
          {renderPanelOpen ? (
            <View className="border-t border-slate-200 bg-slate-50 p-4">
              <Text className="text-[12px] leading-5 text-slate-600">
                Create a Personal API Key in Render → Account Settings → API Keys. It starts with rnd_ and is
                validated, encrypted, and never shown again.
              </Text>
              <Pressable
                accessibilityRole="link"
                onPress={() => void Linking.openURL(RENDER_API_KEYS_URL)}
                className="mt-3 flex-row items-center justify-between border border-slate-200 bg-white px-3 py-3"
              >
                <Text className="font-mono text-[11px] font-semibold text-deplo-black">Open Render API keys</Text>
                <ChevronRight size={14} strokeWidth={1.8} className="text-slate-400" />
              </Pressable>
              <TextInput
                accessibilityLabel="Render API key"
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setRenderKey}
                placeholder="rnd_…"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={renderKey}
                className="mt-3 border border-slate-300 bg-white px-3 py-3 font-mono text-[12px] text-deplo-black"
              />
              <View className="mt-3 flex-row gap-2">
                <Pressable
                  accessibilityRole="button"
                  disabled={!renderKey.trim() || renderBusy}
                  onPress={() => void submitRenderKey()}
                  className={`flex-1 flex-row items-center justify-center gap-2 px-4 py-3 ${renderKey.trim() && !renderBusy ? "bg-deplo-black" : "bg-slate-300"}`}
                >
                  {renderBusy ? <ActivityIndicator size="small" color="white" /> : null}
                  <Text className="font-mono text-[11px] font-bold uppercase text-white">
                    {renderBusy ? "Validating" : "Validate and connect"}
                  </Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setRenderPanelOpen(false)}
                  className="border border-slate-200 bg-white px-4 py-3"
                >
                  <Text className="font-mono text-[11px] font-bold uppercase text-slate-500">Cancel</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>
        {integrationsError ? (
          <Text className="mx-5 mt-2 text-[11px] text-red-600">{integrationsError}</Text>
        ) : null}

        <SectionLabel>Settings</SectionLabel>
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
            onPress={() => void handleDeviceRegistrationPress()}
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
                <Pressable accessibilityRole="button" onPress={() => void confirmDeviceRevoke(device)} className="border border-red-200 px-3 py-2">
                  <Text className="font-mono text-[10px] font-bold uppercase text-red-700">Revoke</Text>
                </Pressable>
              </View>
            ))}
          </View>
        ) : null}

        <View className="mx-5 mt-5 border border-slate-200 bg-white">
          <SettingRow
            label="Sign out"
            description="End this session and revoke push access"
            icon={<LogOut size={16} strokeWidth={1.7} className="text-red-600" />}
            trailing={<ChevronRight size={16} strokeWidth={1.7} className="text-slate-400" />}
            onPress={() => void handleSignOut()}
          />
        </View>

        <Text className="mt-6 text-center font-mono text-[10px] text-slate-400">
          DEPLO MOBILE · VERSION 1.0.0
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
