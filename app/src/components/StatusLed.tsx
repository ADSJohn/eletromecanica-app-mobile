import React from "react";
import { View } from "react-native";

export default function StatusLed({ color }: { color: string }) {
  return (
    <View
      style={{
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: color,
      }}
    />
  );
}
