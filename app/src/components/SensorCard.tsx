import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { colors } from "../theme/colors";

interface Props {
  titulo: string;
  unidade: string;
  valores?: number[];
  limiteIdeal: number;
  limiteCritico: number;
}

export default function SensorCard({
  titulo,
  unidade,
  valores = [],
  limiteIdeal,
  limiteCritico,
}: Props) {
  const valorAtual = valores.length > 0 ? valores[valores.length - 1] : 0;

  let status = "NORMAL";
  let cor = colors.success;

  if (valorAtual > limiteCritico) {
    status = "CRÍTICO";
    cor = colors.danger;
  } else if (valorAtual > limiteIdeal) {
    status = "ALERTA";
    cor = colors.warning;
  }

  const data = valores.map((v) => ({ value: v }));

  return (
    <View style={styles.card}>
      <Text style={styles.titulo}>{titulo}</Text>

      <Text style={[styles.valor, { color: cor }]}>
        {valorAtual.toFixed(1)} {unidade}
      </Text>

      <Text style={[styles.status, { color: cor }]}>{status}</Text>

      {data.length > 1 && (
        <LineChart
          data={data}
          height={140}
          thickness={2}
          color={cor}
          hideDataPoints
          spacing={22}
          yAxisThickness={0}
          xAxisThickness={0}
          rulesColor="#1e293b"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  titulo: {
    color: colors.muted,
    fontSize: 14,
    marginBottom: 6,
  },
  valor: {
    fontSize: 26,
    fontWeight: "bold",
  },
  status: {
    fontSize: 12,
    marginBottom: 12,
  },
});
