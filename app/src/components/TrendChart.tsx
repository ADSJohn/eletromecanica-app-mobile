import React from "react";
import { Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";

export default function TrendChart({ data }) {
  return (
    <LineChart
      data={{
        labels: [],
        datasets: [{ data }],
      }}
      width={Dimensions.get("window").width - 30}
      height={150}
      chartConfig={{
        backgroundColor: "#111827",
        backgroundGradientFrom: "#111827",
        backgroundGradientTo: "#111827",
        decimalPlaces: 0,
        color: () => "#00d4ff",
      }}
    />
  );
}
