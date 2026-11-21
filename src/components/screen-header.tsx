import { Text, View } from "react-native";

export function ScreenHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description?: string;
}) {
  return (
    <View className="gap-1 px-5 pb-5 pt-3">
      <Text className="font-mono text-[10px] font-bold uppercase tracking-widest text-slate-500">
        {eyebrow}
      </Text>
      <Text className="text-[30px] font-bold tracking-tight text-deplo-black">{title}</Text>
      {description ? (
        <Text className="mt-1 text-[14px] leading-5 text-deplo-slate">{description}</Text>
      ) : null}
    </View>
  );
}
