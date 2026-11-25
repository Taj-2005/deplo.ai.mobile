import { useEffect, useState } from "react";
import { AccessibilityInfo, Animated, Easing, Text, View } from "react-native";

const CYAN = "#00D2FF";
const VIOLET = "#7928CA";

export function BrandLoader({ label }: { label?: string }) {
  const [pulse] = useState(() => new Animated.Value(0));
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (!cancelled) setReduceMotion(enabled);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) return;
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1700,
        easing: Easing.inOut(Easing.ease),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduceMotion]);

  const badgeScale = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.12, 1] });
  const cyanRingScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.85] });
  const cyanRingOpacity = pulse.interpolate({ inputRange: [0, 0.55, 1], outputRange: [0.55, 0.12, 0] });
  const violetRingScale = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1, 1.85] });
  const violetRingOpacity = pulse.interpolate({ inputRange: [0, 0.5, 0.85, 1], outputRange: [0, 0, 0.45, 0] });

  return (
    <View style={{ alignItems: "center", justifyContent: "center" }}>
      <View style={{ height: 112, width: 112, alignItems: "center", justifyContent: "center" }}>
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            height: 56,
            width: 56,
            borderRadius: 28,
            borderWidth: 1.5,
            borderColor: CYAN,
            opacity: reduceMotion ? 0 : cyanRingOpacity,
            transform: [{ scale: reduceMotion ? 1 : cyanRingScale }],
          }}
        />
        <Animated.View
          pointerEvents="none"
          style={{
            position: "absolute",
            height: 56,
            width: 56,
            borderRadius: 28,
            borderWidth: 1.5,
            borderColor: VIOLET,
            opacity: reduceMotion ? 0 : violetRingOpacity,
            transform: [{ scale: reduceMotion ? 1 : violetRingScale }],
          }}
        />
        <Animated.View
          style={{
            height: 48,
            width: 48,
            borderRadius: 24,
            backgroundColor: "#0A0A0A",
            alignItems: "center",
            justifyContent: "center",
            transform: [{ scale: reduceMotion ? 1 : badgeScale }],
          }}
        >
          <Text style={{ fontSize: 18, fontWeight: "700", color: "#FFFFFF" }}>D</Text>
        </Animated.View>
      </View>
      {label ? (
        <Text className="mt-3 font-mono text-[11px] font-bold uppercase tracking-widest text-slate-500">
          {label}
        </Text>
      ) : null}
    </View>
  );
}
