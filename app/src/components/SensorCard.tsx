import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { startAlarm, stopAlarm } from "../services/alarmSound";
import { diagnostico } from "../utils/diagnostico";
import { gerarTempo } from "../utils/timeLabels";
import { useAlert } from "../context/AlertContext";
import CriticalPulse from "./CriticalPulse";

export default function SensorCard({
  titulo,
  unidade,
  valores = [],
  limiteIdeal,
  limiteCritico,
}: any) {
  const valorAtual = valores.at(-1) ?? 0;
  const { acknowledged, setAcknowledged } = useAlert();

  let status = "NORMAL";
  let cor = "#22c55e";
  let icone = "🟢";
  let volume = 0;

  if (valorAtual > limiteCritico) {
    status = "CRÍTICO";
    cor = "#ef4444";
    icone = "🔴";
    volume = 1;
  } else if (valorAtual > limiteIdeal) {
    status = "ALERTA";
    cor = "#facc15";
    icone = "🟡";
    volume = 0.4;
  }

  useEffect(() => {
    if (status === "CRÍTICO" && !acknowledged) {
      startAlarm(volume);
    } else {
      stopAlarm();
    }
  }, [status, acknowledged]);

  return (
    <View style={[styles.card, { borderColor: cor }]}>
      <View style={styles.header}>
        <Text style={styles.titulo}>
          {icone} {titulo}
        </Text>
        {status === "CRÍTICO" && <CriticalPulse ativo />}
      </View>

      <Text style={[styles.valor, { color: cor }]}>
        {valorAtual.toFixed(1)} {unidade}
      </Text>

      <Text style={{ color: cor }}>{status}</Text>

      <LineChart
        data={valores.map((v: number, i: number) => ({
          value: v,
          label: gerarTempo(i, valores.length),
        }))}
        height={140}
        thickness={2}
        color={cor}
        hideDataPoints={false}
        spacing={42}
        yAxisThickness={1}
        xAxisThickness={1}
      />

      {status === "CRÍTICO" && (
        <>
          <Text style={styles.diagnostico}>
            🧠 {diagnostico(titulo, valorAtual)}
          </Text>

          <TouchableOpacity
            style={styles.ack}
            onPress={() => setAcknowledged(true)}
          >
            <Text style={{ color: "#fff" }}>🔇 PAUSAR ALARME</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#020617",
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  titulo: {
    color: "#e5e7eb",
    fontSize: 14,
  },
  valor: {
    fontSize: 26,
    fontWeight: "bold",
    marginVertical: 6,
  },
  diagnostico: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 6,
  },
  ack: {
    marginTop: 8,
    backgroundColor: "#ef4444",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
  },
});
