import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Audio } from "expo-av";
import SensorCard from "../components/SensorCard";
import { gerarRelatorioPDF } from "../services/pdfReport";
import { diagnostico } from "../utils/diagnostico";
import { acaoRecomendada } from "../utils/acaoRecomendada";

export default function Dashboard() {
  const alarmRef = useRef<Audio.Sound | null>(null);
  const [alarmAtivo, setAlarmAtivo] = useState(false);

  const [dados, setDados] = useState({
    temperatura: [55, 62, 70, 82, 95],
    vibracao: [1.2, 2.4, 3.1, 4.8, 6.5],
    rpm: [1200, 1400, 1600, 1850, 2100],
  });

  async function tocarAlarme() {
    if (alarmAtivo) return;

    const { sound } = await Audio.Sound.createAsync(
      require("../../assets/alarm.mp3"),
      { isLooping: true, volume: 1.0 }
    );

    alarmRef.current = sound;
    await sound.playAsync();
    setAlarmAtivo(true);
  }

  async function pararAlarme() {
    if (alarmRef.current) {
      await alarmRef.current.stopAsync();
      await alarmRef.current.unloadAsync();
      alarmRef.current = null;
    }
    setAlarmAtivo(false);
  }

  const sensoresPDF = [
    {
      nome: "Temperatura",
      valor: dados.temperatura.at(-1),
      unidade: "°C",
      status: "CRÍTICO",
      icone: "🌡️",
      diagnostico: diagnostico("Temperatura", dados.temperatura.at(-1)!),
      acao: acaoRecomendada("CRÍTICO"),
    },
    {
      nome: "Vibração",
      valor: dados.vibracao.at(-1),
      unidade: "mm/s",
      status: "ALERTA",
      icone: "📈",
      diagnostico: diagnostico("Vibração", dados.vibracao.at(-1)!),
      acao: acaoRecomendada("ALERTA"),
    },
    {
      nome: "RPM",
      valor: dados.rpm.at(-1),
      unidade: "RPM",
      status: "NORMAL",
      icone: "⚙️",
      diagnostico: diagnostico("RPM", dados.rpm.at(-1)!),
      acao: acaoRecomendada("NORMAL"),
    },
  ];

  useEffect(() => {
    if (dados.temperatura.at(-1)! >= 90) tocarAlarme();
  }, [dados]);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🏭 Monitoramento Industrial</Text>

      <TouchableOpacity
        style={styles.pdfBtn}
        onPress={() => gerarRelatorioPDF(sensoresPDF)}
      >
        <Text style={styles.pdfText}>📄 Gerar Relatório PDF</Text>
      </TouchableOpacity>

      {alarmAtivo && (
        <TouchableOpacity style={styles.stopBtn} onPress={pararAlarme}>
          <Text style={styles.stopText}>🔇 Silenciar Alarme</Text>
        </TouchableOpacity>
      )}

      <SensorCard
        titulo="Temperatura"
        unidade="°C"
        valores={dados.temperatura}
        limiteIdeal={75}
        limiteCritico={90}
        icone="🌡️"
      />

      <SensorCard
        titulo="Vibração"
        unidade="mm/s"
        valores={dados.vibracao}
        limiteIdeal={3}
        limiteCritico={6}
        icone="📈"
      />

      <SensorCard
        titulo="RPM"
        unidade="RPM"
        valores={dados.rpm}
        limiteIdeal={1800}
        limiteCritico={2200}
        icone="⚙️"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, backgroundColor: "#020617" },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  pdfBtn: {
    backgroundColor: "#2563eb",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  pdfText: { color: "#fff", textAlign: "center" },
  stopBtn: {
    backgroundColor: "#dc2626",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
  },
  stopText: { color: "#fff", textAlign: "center" },
});
