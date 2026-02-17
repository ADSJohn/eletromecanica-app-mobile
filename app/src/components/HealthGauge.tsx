import React from "react";
import { Text } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";

export default function HealthGauge({ value }) {
  const color = value > 70 ? "#00ff00" : value > 40 ? "#ffff00" : "#ff0000";

  return (
    <AnimatedCircularProgress
      size={180}
      width={18}
      fill={value}
      tintColor={color}
      backgroundColor="#1f2937"
    >
      {() => <Text style={{ color: "#fff", fontSize: 28 }}>{value}%</Text>}
    </AnimatedCircularProgress>
  );
}
