import { Text, View } from "react-native";
import { WifiOff } from "lucide-react-native";

export function OfflineBanner({
  stale,
  updatedAt,
  onRetry,
}: {
  stale: boolean;
  updatedAt?: string | null;
  onRetry: () => void;
}) {
  if (!stale) return null;

  return (
    <View className="mx-5 mb-5 border border-amber-200 bg-amber-50 p-4">
      <View className="flex-row items-center gap-2">
        <WifiOff size={15} strokeWidth={1.8} className="text-amber-700" />
        <Text className="text-[13px] font-bold text-amber-800">Offline or server unavailable</Text>
      </View>
      <Text className="mt-1 text-[12px] leading-5 text-amber-700">
        {updatedAt
          ? `Showing cached status from ${new Date(updatedAt).toLocaleString()}`
          : "Showing the last available local state"}
      </Text>
      <Text
        onPress={onRetry}
        className="mt-3 font-mono text-[11px] font-bold text-amber-800"
      >
        Retry connection
      </Text>
    </View>
  );
}
