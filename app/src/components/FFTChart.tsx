import React from "react";
import { View, Text } from "react-native";
import { LineChart } from "react-native-gifted-charts";

export default function FFTChart({ freqs, mags }: any) {
  const data = freqs.map((f: number, i: number) => ({
    value: mags[i],
    label: f.toFixed(0),
  }));

  return (
    <View>
      <Text style={{ color: "#fff", marginBottom: 6 }}>
        📈 Espectro de Vibração (FFT)
      </Text>
      <LineChart
        data={data}
        height={220}
        spacing={40}
        thickness={2}
        color="#38bdf8"
        hideDataPoints
        yAxisLabelSuffix=" g"
        xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 10 }}
      />
    </View>
  );
}
