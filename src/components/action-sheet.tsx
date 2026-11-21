import { Modal, Pressable, Text, View } from "react-native";

export function ActionSheet({
  visible,
  title,
  description,
  confirmLabel,
  destructive = false,
  onCancel,
  onConfirm,
}: {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  destructive?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onCancel}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onCancel}>
        <Pressable className="border-t border-slate-200 bg-white px-5 pb-8 pt-3" onPress={() => undefined}>
          <View className="mb-5 h-1 w-10 self-center rounded-full bg-slate-300" />
          <Text className="text-[20px] font-bold text-deplo-black">{title}</Text>
          <Text className="mt-2 text-[13px] leading-5 text-slate-600">{description}</Text>
          <Pressable
            accessibilityRole="button"
            onPress={onConfirm}
            className={`mt-6 items-center border px-4 py-4 ${
              destructive ? "border-red-700 bg-red-700" : "border-deplo-black bg-deplo-black"
            }`}
          >
            <Text className="font-mono text-[13px] font-bold text-white">{confirmLabel}</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={onCancel} className="mt-2 items-center py-3">
            <Text className="font-mono text-[13px] font-bold text-slate-600">Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
