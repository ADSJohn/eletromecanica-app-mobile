import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import SensorCard from "../../src/components/SensorCard";

const { width } = Dimensions.get("window");

export default function Dashboard() {
  const [dados, setDados] = useState({
    temperatura: [55, 58, 60, 62, 61],
    vibracao: [1.2, 1.5, 1.4, 1.7, 2.1],
    pressao: [80, 82, 85, 88, 90],
  });

  // Simula atualização de sensores
  useEffect(() => {
    const interval = setInterval(() => {
      setDados((prev) => ({
        temperatura: [...prev.temperatura.slice(-4), Math.random() * 40 + 50],
        vibracao: [...prev.vibracao.slice(-4), Math.random() * 3],
        pressao: [...prev.pressao.slice(-4), Math.random() * 30 + 70],
      }));
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <SensorCard
        titulo="🌡 Temperatura (°C)"
        valores={dados.temperatura}
        limiteIdeal={65}
        limiteCritico={80}
      />

      <SensorCard
        titulo="🌀 Vibração (mm/s)"
        valores={dados.vibracao}
        limiteIdeal={1.8}
        limiteCritico={2.5}
      />

      <SensorCard
        titulo="⛽ Pressão (PSI)"
        valores={dados.pressao}
        limiteIdeal={90}
        limiteCritico={110}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#121212",
    minHeight: "100%",
  },
});
