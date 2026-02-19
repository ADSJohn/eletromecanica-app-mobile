import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function SpectrumChart({ freqs, amps }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.axis}>Frequência (Hz) × Amplitude (g)</Text>

      <LineChart
        data={{
          labels: freqs.filter((_: any, i: number) => i % 10 === 0),
          datasets: [{ data: amps }],
          legend: ["Espectro FFT"],
        }}
        width={screenWidth - 60}
        height={260}
        chartConfig={{
          backgroundGradientFrom: "#141414",
          backgroundGradientTo: "#141414",
          color: () => "#00e5ff",
          labelColor: () => "#aaa",
        }}
        withDots={false}
        withShadow
        bezier
        style={{ borderRadius: 12 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginTop: 10 },
  axis: { color: "#aaa", marginBottom: 5 },
});
