import { Text, View } from "react-native";
import type { LucideIcon } from "lucide-react-native";

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: "neutral" | "success" | "danger";
}) {
  const toneClasses =
    tone === "success"
      ? "bg-green-50 border-green-200"
      : tone === "danger"
        ? "bg-red-50 border-red-200"
        : "bg-white border-slate-200";
  const iconClasses =
    tone === "success"
      ? "text-green-700"
      : tone === "danger"
        ? "text-red-700"
        : "text-slate-600";

  return (
    <View className={`min-h-28 flex-1 border p-4 ${toneClasses}`}>
      <View className="mb-3 flex-row items-center justify-between">
        <Text className="font-mono text-[10px] font-bold uppercase tracking-wider text-slate-500">
          {label}
        </Text>
        <Icon size={16} strokeWidth={1.7} className={iconClasses} />
      </View>
      <Text className="text-[26px] font-bold tracking-tight text-deplo-black">{value}</Text>
      <Text className="mt-1 text-[11px] leading-4 text-slate-500">{detail}</Text>
    </View>
  );
}
