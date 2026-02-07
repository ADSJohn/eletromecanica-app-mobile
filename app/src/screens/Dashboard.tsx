import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Pressable,
  Alert,
} from "react-native";
import Svg, { Polyline } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { createAudioPlayer } from "expo-audio";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const { width } = Dimensions.get("window");

/* ================= CONFIG ================= */

const GRAPH_WIDTH = width - 32;
const GRAPH_HEIGHT = 160;
const TEMP_CRITICA = 80;

/* ================= DASHBOARD ================= */

export default function Dashboard() {
  const [temp, setTemp] = useState<number[]>([]);
  const [fftVib, setFftVib] = useState<number[]>([]);
  const [fftDes, setFftDes] = useState<number[]>([]);
  const [alerta, setAlerta] = useState<string | null>(null);

  const vibracaoRef = useRef<NodeJS.Timeout | null>(null);
  const sireneRef = useRef<any>(null);

  /* ================= SIMULAÇÃO ================= */

  useEffect(() => {
    const interval = setInterval(() => {
      const t = 60 + Math.random() * 30;
      const vib = Array.from({ length: 32 }, () => Math.random() * 10);
      const des = Array.from({ length: 32 }, () => Math.random() * 6);

      setTemp((p) => [...p.slice(-20), t]);
      setFftVib(vib);
      setFftDes(des);

      if (t > TEMP_CRITICA && !alerta) {
        iniciarAlerta(t);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [alerta]);

  /* ================= ALERTA ================= */

  const iniciarAlerta = async (t: number) => {
    setAlerta(`⚠ ALERTA CRÍTICO — ${t.toFixed(1)} °C`);

    vibracaoRef.current = setInterval(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, 1500);

    const player = createAudioPlayer(require("../../assets/alarm.mp3"));
    player.loop = true;
    player.play();
    sireneRef.current = player;
  };

  const pararAlerta = () => {
    setAlerta(null);

    if (vibracaoRef.current) {
      clearInterval(vibracaoRef.current);
      vibracaoRef.current = null;
    }

    if (sireneRef.current) {
      sireneRef.current.stop();
      sireneRef.current = null;
    }
  };

  /* ================= PDF (FORMA CORRETA) ================= */

  const gerarRelatorioPDF = async () => {
    try {
      const html = `
      <html>
        <body style="font-family: Arial; padding: 24px;">
          <h2>Relatório de Monitoramento do Motor</h2>
          <p><b>Data:</b> ${new Date().toLocaleString()}</p>

          <h3>Resumo Técnico</h3>
          <ul>
            <li>Temperatura atual: ${temp[temp.length - 1]?.toFixed(1)} °C</li>
            <li>Pico FFT Vibração: ${Math.max(...fftVib).toFixed(2)}</li>
            <li>Pico FFT Desbalanceamento: ${Math.max(...fftDes).toFixed(2)}</li>
          </ul>

          ${
            alerta
              ? `<h3 style="color:red;">Alerta Detectado</h3><p>${alerta}</p>`
              : "<p>Nenhum alerta crítico registrado.</p>"
          }

          <hr />
          <p style="font-size:12px;">
            Relatório gerado automaticamente pelo sistema de monitoramento.
          </p>
        </body>
      </html>
      `;

      const { uri } = await Print.printToFileAsync({
        html,
      });

      await Sharing.shareAsync(uri);
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Falha ao gerar relatório PDF");
    }
  };

  /* ================= RENDER ================= */

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Monitoramento do Motor</Text>

      {alerta && (
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>{alerta}</Text>
          <Pressable style={styles.stopBtn} onPress={pararAlerta}>
            <Text style={styles.stopTxt}>PARAR ALERTA</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.subtitle}>Temperatura</Text>
      <Chart data={temp} max={100} />

      <Text style={styles.subtitle}>FFT Vibração</Text>
      <Chart data={fftVib} max={10} />

      <Text style={styles.subtitle}>FFT Desbalanceamento</Text>
      <Chart data={fftDes} max={8} />

      <Pressable style={styles.pdfBtn} onPress={gerarRelatorioPDF}>
        <Text style={styles.pdfTxt}>GERAR RELATÓRIO PDF</Text>
      </Pressable>
    </ScrollView>
  );
}

/* ================= GRÁFICO ================= */

function Chart({ data, max }: { data: number[]; max: number }) {
  if (data.length < 2) return null;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * GRAPH_WIDTH;
      const y = GRAPH_HEIGHT - (v / max) * GRAPH_HEIGHT;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT} style={styles.chart}>
      <Polyline points={points} stroke="#2563eb" strokeWidth={2} fill="none" />
    </Svg>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#020617",
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 12,
  },
  subtitle: {
    color: "#cbd5f5",
    marginVertical: 8,
    fontWeight: "600",
  },
  chart: {
    backgroundColor: "#0f172a",
    borderRadius: 8,
    marginBottom: 12,
  },
  alertBox: {
    backgroundColor: "#7f1d1d",
    padding: 14,
    borderRadius: 8,
    marginBottom: 12,
  },
  alertText: {
    color: "#fecaca",
    fontWeight: "bold",
    marginBottom: 8,
  },
  stopBtn: {
    backgroundColor: "#dc2626",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  stopTxt: {
    color: "#fff",
    fontWeight: "bold",
  },
  pdfBtn: {
    backgroundColor: "#2563eb",
    padding: 14,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 30,
  },
  pdfTxt: {
    color: "#fff",
    fontWeight: "bold",
  },
});
