import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { preverFalha } from "../utils/predicaoFalha";

interface Props {
  titulo: string;
  unidade: string;
  valores: number[];
  limiteIdeal: number;
  limiteCritico: number;
  icone: string;
}

function gerarDadosComTempo(valores: number[]) {
  const agora = new Date();

  return valores.map((valor, index) => {
    const tempo = new Date(
      agora.getTime() - (valores.length - index - 1) * 10 * 60000
    );

    return {
      value: valor,
      label: tempo.toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  });
}

export default function SensorCard({
  titulo,
  unidade,
  valores,
  limiteIdeal,
  limiteCritico,
  icone,
}: Props) {
  const atual = valores[valores.length - 1];
  const dados = gerarDadosComTempo(valores);

  const status =
    atual >= limiteCritico
      ? "CRÍTICO"
      : atual >= limiteIdeal
      ? "ALERTA"
      : "NORMAL";

  const predicao = preverFalha(valores);

  return (
    <View style={styles.card}>
      <Text style={styles.title}>
        {icone} {titulo}
      </Text>

      <Text style={styles.valorAtual}>
        Atual: {atual} {unidade}
      </Text>

      <Text style={styles.status}>Status: {status}</Text>

      <LineChart
        data={dados}
        height={180}
        spacing={50}
        thickness={3}
        color="#22c55e"
        textColor="#e5e7eb"
        showVerticalLines
        showDataPoint
        dataPointsColor="#22c55e"
        dataPointsRadius={4}
        showValuesAsDataPointsText
        dataPointsTextStyle={{
          color: "#fff",
          fontSize: 10,
        }}
        xAxisLabelTextStyle={{
          color: "#94a3b8",
          fontSize: 10,
        }}
        yAxisTextStyle={{
          color: "#94a3b8",
          fontSize: 10,
        }}
        noOfSections={4}
        rulesColor="#1e293b"
      />

      {predicao && <Text style={styles.predicao}>🧠 {predicao.mensagem}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#020617",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  title: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  valorAtual: {
    color: "#38bdf8",
    marginVertical: 4,
  },
  status: {
    color: "#94a3b8",
    marginBottom: 8,
  },
  predicao: {
    color: "#fb7185",
    marginTop: 8,
    fontWeight: "bold",
  },
});
