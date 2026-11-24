import { useState } from "react";
import { Image, Text, View } from "react-native";

export function UserAvatar({
  avatarUrl,
  name,
  size = 40,
}: {
  avatarUrl?: string | null;
  name?: string | null;
  size?: number;
}) {
  const [failed, setFailed] = useState(false);
  const initial = (name ?? "U").trim()[0]?.toUpperCase() ?? "U";

  if (!avatarUrl || failed) {
    return (
      <View
        style={{ width: size, height: size, borderRadius: size / 2 }}
        className="items-center justify-center border border-slate-200 bg-deplo-black"
      >
        <Text style={{ fontSize: Math.round(size * 0.4) }} className="font-mono font-bold text-white">
          {initial}
        </Text>
      </View>
    );
  }

  return (
    <Image
      source={{ uri: avatarUrl }}
      onError={() => setFailed(true)}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      className="border border-slate-200"
    />
  );
}
