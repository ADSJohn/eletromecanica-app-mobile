import React from "react";
import { View } from "react-native";

export default function Card({ children, style }) {
  return (
    <View
      style={[
        {
          backgroundColor: "#2b2e34",
          borderRadius: 10,
          padding: 15,
          marginBottom: 15,
          borderWidth: 1,
          borderColor: "#444",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
