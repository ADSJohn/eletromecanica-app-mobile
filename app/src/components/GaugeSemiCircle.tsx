import React from "react";
import { View, Text } from "react-native";
import Svg, { Path, Circle } from "react-native-svg";

export default function GaugeSemiCircle({ value }) {
  const radius = 80;
  const strokeWidth = 15;
  const angle = (value / 100) * 180;

  const describeArc = (angle) => {
    const x = radius + radius * Math.cos(Math.PI - (angle * Math.PI) / 180);
    const y = radius - radius * Math.sin(Math.PI - (angle * Math.PI) / 180);
    return `M ${radius - radius} ${radius}
            A ${radius} ${radius} 0 ${angle > 180 ? 1 : 0} 1 ${x} ${y}`;
  };

  const color = value > 70 ? "#4CAF50" : value > 40 ? "#FFC107" : "#F44336";

  return (
    <View style={{ alignItems: "center" }}>
      <Svg width={200} height={120}>
        <Path
          d={`M 0 ${radius} A ${radius} ${radius} 0 0 1 ${radius * 2} ${radius}`}
          stroke="#444"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Path
          d={describeArc(angle)}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
        />
      </Svg>
      <Text style={{ color: "#fff", fontSize: 28, marginTop: -40 }}>
        {value}%
      </Text>
      <Text style={{ color: "#aaa" }}>Health Index</Text>
    </View>
  );
}
