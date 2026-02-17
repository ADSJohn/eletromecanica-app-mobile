import React from "react";
import { View, Text } from "react-native";

export default function AlarmCard({ status }) {
  const color =
    status === "normal"
      ? "#4CAF50"
      : status === "warning"
        ? "#FFC107"
        : "#F44336";

  return (
    <View
      style={{
        backgroundColor: color,
        padding: 15,
        borderRadius: 8,
        alignItems: "center",
      }}
    >
      <Text style={{ fontWeight: "bold", color: "#000" }}>
        {status.toUpperCase()}
      </Text>
    </View>
  );
}
