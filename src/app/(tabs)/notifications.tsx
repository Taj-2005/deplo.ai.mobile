import { ScrollView, Text, View } from "react-native";
import { AlertTriangle, CheckCircle2, PauseCircle } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScreenHeader } from "@/components/screen-header";

const alerts = [
  {
    id: "1",
    icon: AlertTriangle,
    iconClass: "text-red-700",
    surfaceClass: "bg-red-50 border-red-200",
    title: "payment-api deployment failed",
    detail: "Dependency install · Cannot resolve package",
    time: "8 min ago",
  },
  {
    id: "2",
    icon: CheckCircle2,
    iconClass: "text-green-700",
    surfaceClass: "bg-green-50 border-green-200",
    title: "storefront is live",
    detail: "Frontend responded successfully in 142 ms",
    time: "24 min ago",
  },
  {
    id: "3",
    icon: PauseCircle,
    iconClass: "text-amber-700",
    surfaceClass: "bg-amber-50 border-amber-200",
    title: "docs-preview requires environment values",
    detail: "2 variables are required before deployment",
    time: "Yesterday",
  },
];

export default function NotificationsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#F6FAFE]" edges={["top"]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 28 }} showsVerticalScrollIndicator={false}>
        <ScreenHeader
          eyebrow="Activity"
          title="Alerts"
          description="Deployment outcomes and project health notifications."
        />

        <View className="mx-5 border border-slate-200 bg-white">
          {alerts.map((alert, index) => {
            const Icon = alert.icon;
            return (
              <View
                key={alert.id}
                className={`flex-row gap-3 p-4 ${index > 0 ? "border-t border-slate-200" : ""}`}
              >
                <View className={`h-10 w-10 items-center justify-center border ${alert.surfaceClass}`}>
                  <Icon size={17} strokeWidth={1.8} className={alert.iconClass} />
                </View>
                <View className="flex-1">
                  <Text className="text-[13px] font-bold leading-5 text-deplo-black">
                    {alert.title}
                  </Text>
                  <Text className="mt-1 text-[12px] leading-4 text-slate-500">{alert.detail}</Text>
                  <Text className="mt-2 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                    {alert.time}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
