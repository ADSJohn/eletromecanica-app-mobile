import React, { useEffect } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { colors } from "../theme/colors";
import { playAlarm, stopAlarm } from "../services/alarmSound";
import { diagnostico } from "../utils/diagnostico";
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
  let cor = colors.success;
  let icone = "🟢";
  let volume = 0;

  if (valorAtual > limiteCritico) {
    status = "CRÍTICO";
    cor = colors.danger;
    icone = "🔴";
    volume = 1.0;
  } else if (valorAtual > limiteIdeal) {
    status = "ALERTA";
    cor = colors.warning;
    icone = "🟡";
    volume = 0.4;
  }

  useEffect(() => {
    if (status === "CRÍTICO" && !acknowledged) playAlarm(volume);
    else stopAlarm();
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
        data={valores.map((v: number) => ({ value: v }))}
        height={120}
        color={cor}
        hideDataPoints
        yAxisThickness={0}
        xAxisThickness={0}
      />

      {status === "CRÍTICO" && (
        <>
          <Text style={styles.diagnostico}>
            🧠 {diagnostico(titulo.split(" ")[0], valorAtual)}
          </Text>

          <TouchableOpacity
            style={styles.ack}
            onPress={() => setAcknowledged(true)}
          >
            <Text style={{ color: "#fff" }}>🔇 ACKNOWLEDGE</Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
  },
  titulo: {
    color: colors.text,
    fontSize: 14,
  },
  valor: {
    fontSize: 26,
    fontWeight: "bold",
    marginVertical: 6,
  },
  diagnostico: {
    color: colors.muted,
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
