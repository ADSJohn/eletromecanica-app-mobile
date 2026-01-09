import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LineChart } from "react-native-gifted-charts";

interface Props {
  titulo: string;
  valores?: number[];
  limiteIdeal: number;
  limiteCritico: number;
}

export default function SensorCard({
  titulo,
  valores = [],
  limiteIdeal,
  limiteCritico,
}: Props) {
  const valorAtual = valores.length > 0 ? valores[valores.length - 1] : 0;

  let status = "OK";
  let cor = "#2ecc71";

  if (valorAtual > limiteCritico) {
    status = "CRÍTICO";
    cor = "#e74c3c";
  } else if (valorAtual > limiteIdeal) {
    status = "ALERTA";
    cor = "#f39c12";
  }

  const dadosGrafico = valores.map((v) => ({
    value: v,
  }));

  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>{titulo}</Text>

      <Text style={[styles.status, { color: cor }]}>
        {status} — {valorAtual}
      </Text>

      {dadosGrafico.length > 0 && (
        <LineChart
          data={dadosGrafico}
          height={160}
          thickness={2}
          color={cor}
          hideDataPoints
          spacing={20}
          yAxisThickness={0}
          xAxisThickness={0}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1e1e1e",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  titulo: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 6,
  },
  status: {
    fontSize: 14,
    marginBottom: 12,
  },
});
