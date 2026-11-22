import { useEffect, useState } from "react";
import { Pressable, ScrollView, Switch, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { ArrowLeft, BellRing } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  loadNotificationPreferences,
  setProjectCategoryEnabled,
} from "@/lib/notification-preferences";
import { getProject } from "@/lib/mobile-data";
import type { NotificationCategory } from "@/types/notifications";
import { fetchRepositories } from "@/lib/api";
import { isDemoMode } from "@/lib/app-config";

const categoryLabels: {
  category: NotificationCategory;
  label: string;
  description: string;
}[] = [
  {
    category: "deployment-success",
    label: "Deployment succeeds",
    description: "Notify when a build finishes and the app is live.",
  },
  {
    category: "deployment-failed",
    label: "Deployment fails",
    description: "Notify with the failing stage and first error.",
  },
  {
    category: "environment-required",
    label: "Environment values required",
    description: "Notify when a deployment pauses for configuration.",
  },
  {
    category: "project-down",
    label: "Project goes down",
    description: "Notify when uptime probing detects an outage.",
  },
  {
    category: "project-recovered",
    label: "Project recovers",
    description: "Notify when a frontend or backend becomes healthy.",
  },
];

export default function ProjectAlertPreferencesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [projectName, setProjectName] = useState(isDemoMode ? getProject(id)?.name ?? "Project" : "Project");
  const [categories, setCategories] = useState<Record<NotificationCategory, boolean>>({
    "deployment-success": true,
    "deployment-failed": true,
    "environment-required": true,
    "project-down": true,
    "project-recovered": true,
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDemoMode) {
        void fetchRepositories().then((repositories) => {
          const repository = repositories.find((item) => item.id === id);
          if (repository) setProjectName(repository.name);
        }).catch(() => undefined);
      }
      void loadNotificationPreferences().then((preferences) => {
        const overrides = preferences.projectOverrides[id] ?? {};
        setCategories({
          "deployment-success": overrides["deployment-success"] ?? preferences.categories["deployment-success"],
          "deployment-failed": overrides["deployment-failed"] ?? preferences.categories["deployment-failed"],
          "environment-required": overrides["environment-required"] ?? preferences.categories["environment-required"],
          "project-down": overrides["project-down"] ?? preferences.categories["project-down"],
          "project-recovered": overrides["project-recovered"] ?? preferences.categories["project-recovered"],
        });
      });
    }, 0);
    return () => clearTimeout(timer);
  }, [id]);

  async function handleCategoryChange(category: NotificationCategory, enabled: boolean) {
    setCategories((current) => ({ ...current, [category]: enabled }));
    try {
      await setProjectCategoryEnabled(id, category, enabled);
    } catch {
      setCategories((current) => ({ ...current, [category]: !enabled }));
    }
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
            <View className="h-10 w-10 items-center justify-center border border-slate-200 bg-white">
              <BellRing size={18} strokeWidth={1.7} className="text-slate-600" />
            </View>
            <View className="flex-1">
              <Text className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Project alerts
              </Text>
              <Text className="mt-1 text-[22px] font-bold tracking-tight text-deplo-black">
                {projectName}
              </Text>
            </View>
          </View>
        </View>

        <View className="mx-5 border border-slate-200 bg-white">
          {categoryLabels.map((item, index) => (
            <View
              key={item.category}
              className={`flex-row items-center gap-4 px-4 py-4 ${
                index > 0 ? "border-t border-slate-200" : ""
              }`}
            >
              <View className="flex-1">
                <Text className="text-[13px] font-bold text-deplo-black">{item.label}</Text>
                <Text className="mt-1 text-[11px] leading-4 text-slate-500">
                  {item.description}
                </Text>
              </View>
              <Switch
                value={categories[item.category]}
                onValueChange={(enabled) => void handleCategoryChange(item.category, enabled)}
                trackColor={{ false: "#CBD5E1", true: "#171C1F" }}
                thumbColor="#FFFFFF"
              />
            </View>
          ))}
        </View>

        <Text className="mx-8 mt-4 text-center font-mono text-[10px] leading-4 text-slate-400">
          Project choices override the global notification categories on this device.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}
