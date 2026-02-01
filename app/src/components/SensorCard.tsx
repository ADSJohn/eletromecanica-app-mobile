import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LineChart } from "react-native-gifted-charts";

export default function SensorCard({ titulo, dados, unidade }: any) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{titulo}</Text>
      <LineChart
        data={dados}
        height={160}
        spacing={35}
        thickness={2}
        color="#22c55e"
        hideDataPoints
        yAxisLabelSuffix={` ${unidade}`}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#020617",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  title: { color: "#fff", fontWeight: "bold", marginBottom: 8 },
});
