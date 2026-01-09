import React from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import SensorCard from "../components/SensorCard";

export default function Dashboard() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🏭 Monitoramento Industrial</Text>

      <SensorCard
        titulo="Temperatura"
        unidade="°C"
        valores={[55, 62, 70, 82, 95]}
        limiteIdeal={75}
        limiteCritico={90}
        icone="🌡️"
      />

      <SensorCard
        titulo="Vibração"
        unidade="mm/s"
        valores={[1.2, 2.1, 3.0, 4.5, 6.3]}
        limiteIdeal={3}
        limiteCritico={6}
        icone="📈"
      />

      <SensorCard
        titulo="RPM"
        unidade="RPM"
        valores={[1200, 1400, 1600, 1850, 2100]}
        limiteIdeal={1800}
        limiteCritico={2200}
        icone="⚙️"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: "#020617", padding: 16 },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
});
