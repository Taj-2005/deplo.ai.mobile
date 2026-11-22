import { Text, View } from "react-native";

export type StatusTone = "success" | "warning" | "danger" | "neutral" | "info";

const toneStyles: Record<StatusTone, { dot: string; text: string; surface: string }> = {
  success: { dot: "bg-green-500", text: "text-green-700", surface: "bg-green-50 border-green-200" },
  warning: { dot: "bg-amber-500", text: "text-amber-700", surface: "bg-amber-50 border-amber-200" },
  danger: { dot: "bg-red-500", text: "text-red-700", surface: "bg-red-50 border-red-200" },
  neutral: { dot: "bg-slate-400", text: "text-slate-600", surface: "bg-slate-50 border-slate-200" },
  info: { dot: "bg-cyan-500", text: "text-cyan-700", surface: "bg-cyan-50 border-cyan-200" },
};

export function StatusPill({ label, tone = "neutral" }: { label: string; tone?: StatusTone }) {
  const styles = toneStyles[tone];

  return (
    <View className={`flex-row items-center gap-1.5 rounded-full border px-2.5 py-1 ${styles.surface}`}>
      <View className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
      <Text className={`font-mono text-[10px] font-semibold uppercase ${styles.text}`}>{label}</Text>
    </View>
  );
}
