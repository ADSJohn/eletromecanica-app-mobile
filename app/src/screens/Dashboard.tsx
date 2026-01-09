import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";

import SensorCard from "../../src/components/SensorCard";
import { colors } from "../theme/colors";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  /**
   * 📊 CENÁRIO SIMULADO
   * Temperatura → NORMAL
   * Velocidade  → ALERTA
   * Alinhamento → CRÍTICO
   */
  const [dados] = useState({
    temperatura: [62, 64, 66, 68],
    velocidade: [1450, 1500, 1580, 1600],
    alinhamento: [1.4, 1.8, 2.2, 2.5],
  });

  /* 🚦 STATUS GLOBAL */
  const statusGlobal =
    dados.temperatura.at(-1)! > 85 ||
    dados.velocidade.at(-1)! > 1650 ||
    dados.alinhamento.at(-1)! > 2
      ? "CRÍTICO"
      : dados.velocidade.at(-1)! > 1550
      ? "ALERTA"
      : "NORMAL";

  const isWide = width >= 900;

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.titulo}>🛠️ Dashboard de Manutenção</Text>

        <Text
          style={[
            styles.statusGlobal,
            {
              color:
                statusGlobal === "CRÍTICO"
                  ? colors.danger
                  : statusGlobal === "ALERTA"
                  ? colors.warning
                  : colors.success,
            },
          ]}
        >
          Status Geral do Sistema: {statusGlobal}
        </Text>
      </View>

      {/* GRID DE SENSORES */}
      <View style={[styles.grid, { flexDirection: isWide ? "row" : "column" }]}>
        <SensorCard
          titulo="Temperatura do Motor"
          unidade="°C"
          valores={dados.temperatura}
          limiteIdeal={75}
          limiteCritico={85}
        />

        <SensorCard
          titulo="Velocidade do Motor"
          unidade="RPM"
          valores={dados.velocidade}
          limiteIdeal={1550}
          limiteCritico={1650}
        />

        <SensorCard
          titulo="Alinhamento do Eixo"
          unidade="mm"
          valores={dados.alinhamento}
          limiteIdeal={1.5}
          limiteCritico={2.0}
        />
      </View>
    </ScrollView>
  );
}

/* 🎨 ESTILOS */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
  },
  header: {
    marginBottom: 20,
  },
  titulo: {
    fontSize: 22,
    fontWeight: "bold",
    color: colors.text,
  },
  statusGlobal: {
    marginTop: 6,
    fontSize: 14,
    fontWeight: "600",
  },
  grid: {
    gap: 16,
    justifyContent: "space-between",
  },
});
