import React from "react";
import { View, Text, ScrollView, StyleSheet, Dimensions } from "react-native";
import SensorCard from "../components/SensorCard";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const dados = {
    temperatura: [62, 65, 68], // 🟢 NORMAL
    velocidade: [1500, 1580, 1600], // 🟡 ALERTA
    alinhamento: [1.8, 2.2, 2.5], // 🔴 CRÍTICO
  };

  const isWide = width > 900;

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🛠️ Monitoramento Industrial</Text>

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
          limiteCritico={2}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 16,
  },
  title: {
    color: "#e5e7eb",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 16,
  },
  grid: {
    gap: 16,
  },
});
