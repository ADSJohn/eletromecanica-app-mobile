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

  const linhaIdeal = dados.map((d) => ({
    value: limiteIdeal,
    label: d.label,
  }));

  const linhaCritica = dados.map((d) => ({
    value: limiteCritico,
    label: d.label,
  }));

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

      <Text
        style={[
          styles.status,
          status === "CRÍTICO"
            ? styles.critico
            : status === "ALERTA"
            ? styles.alerta
            : styles.normal,
        ]}
      >
        Status: {status}
      </Text>

      <LineChart
        data={dados}
        lineData={linhaIdeal}
        lineData2={linhaCritica}
        height={200}
        spacing={50}
        thickness={3}
        color="#22c55e"
        color1="#facc15"
        color2="#ef4444"
        hideDataPoints={false}
        dataPointsRadius={4}
        showValuesAsDataPointsText
        dataPointsTextStyle={{ color: "#fff", fontSize: 10 }}
        xAxisLabelTextStyle={{ color: "#94a3b8", fontSize: 10 }}
        yAxisTextStyle={{ color: "#94a3b8", fontSize: 10 }}
        rulesColor="#1e293b"
        noOfSections={4}
      />

      <View style={styles.legenda}>
        <Text style={styles.legendaTexto}>🟢 Medido</Text>
        <Text style={styles.legendaTexto}>🟡 Limite Ideal</Text>
        <Text style={styles.legendaTexto}>🔴 Limite Crítico</Text>
      </View>

      {predicao && <Text style={styles.predicao}>🧠 {predicao.mensagem}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#020617",
    borderRadius: 12,
    padding: 12,
    marginBottom: 18,
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
    marginBottom: 8,
    fontWeight: "bold",
  },
  normal: { color: "#22c55e" },
  alerta: { color: "#facc15" },
  critico: { color: "#ef4444" },
  legenda: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  legendaTexto: {
    color: "#94a3b8",
    fontSize: 12,
  },
  predicao: {
    color: "#fb7185",
    marginTop: 8,
    fontWeight: "bold",
  },
});
