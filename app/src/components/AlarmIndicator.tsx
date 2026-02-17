import React, { useEffect, useRef } from "react";
import { Animated, Text } from "react-native";

export default function AlarmIndicator({ status }) {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status !== "normal") {
      Animated.loop(
        Animated.sequence([
          Animated.timing(opacity, {
            toValue: 0.2,
            duration: status === "critical" ? 400 : 800,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: status === "critical" ? 400 : 800,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    } else {
      opacity.setValue(1);
    }
  }, [status]);

  const color =
    status === "normal"
      ? "#00ff00"
      : status === "alarm"
        ? "#ffff00"
        : "#ff0000";

  return (
    <Animated.View
      style={{
        backgroundColor: color,
        padding: 15,
        borderRadius: 8,
        opacity,
        marginBottom: 15,
      }}
    >
      <Text style={{ fontWeight: "bold", textAlign: "center" }}>
        STATUS: {status.toUpperCase()}
      </Text>
    </Animated.View>
  );
}
