import React from "react";
import { LineChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";

export default function TimeDomainChart({ rms, peak }) {
  return (
    <LineChart
      data={{
        labels: [],
        datasets: [{ data: rms }, { data: peak }],
      }}
      width={Dimensions.get("window").width - 40}
      height={220}
      chartConfig={{
        backgroundGradientFrom: "#2b2e34",
        backgroundGradientTo: "#2b2e34",
        decimalPlaces: 2,
        color: () => "#fff",
      }}
    />
  );
}
