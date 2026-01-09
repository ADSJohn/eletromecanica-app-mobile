import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";

export default function CriticalPulse({ ativo }: { ativo: boolean }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!ativo) {
      scale.setValue(1);
      return;
    }

    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.4,
          duration: 600,
          useNativeDriver: false,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 600,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [ativo]);

  if (!ativo) return null;

  return <Animated.View style={[styles.dot, { transform: [{ scale }] }]} />;
}

const styles = StyleSheet.create({
  dot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#ef4444",
    marginLeft: 8,
  },
});
