import React, { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import SensorCard from "../components/SensorCard";
import { colors } from "../theme/colors";

const { width } = Dimensions.get("window");

const COLUNAS = width > 900 ? 3 : width > 600 ? 2 : 1;

export default function Dashboard() {
  const [dados, setDados] = useState({
    temperatura: [55, 58, 60, 62, 61],
    vibracao: [1.2, 1.5, 1.4, 1.8, 2.2],
    pressao: [80, 82, 85, 88, 92],
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setDados((prev) => ({
        temperatura: [...prev.temperatura.slice(-5), Math.random() * 40 + 50],
        vibracao: [...prev.vibracao.slice(-5), Math.random() * 3],
        pressao: [...prev.pressao.slice(-5), Math.random() * 30 + 70],
      }));
    }, 3000);

    return () => clearInterval(timer);
  }, []);

  return (
    <ScrollView style={styles.page}>
      <View style={styles.grid}>
        <View style={styles.col}>
          <SensorCard
            titulo="🌡 Temperatura"
            unidade="°C"
            valores={dados.temperatura}
            limiteIdeal={65}
            limiteCritico={80}
          />
        </View>

        <View style={styles.col}>
          <SensorCard
            titulo="🌀 Vibração"
            unidade="mm/s"
            valores={dados.vibracao}
            limiteIdeal={1.8}
            limiteCritico={2.5}
          />
        </View>

        <View style={styles.col}>
          <SensorCard
            titulo="⛽ Pressão"
            unidade="PSI"
            valores={dados.pressao}
            limiteIdeal={90}
            limiteCritico={110}
          />
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: colors.background,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 16,
  },
  col: {
    width: `${100 / COLUNAS}%`,
    padding: 8,
  },
});
