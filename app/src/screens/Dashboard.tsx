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

const CARD_RADIUS = 14;
const GRAPH_HEIGHT = 160;
const GRAPH_WIDTH = width - 64;

const TEMP_CRITICA = 80;
const VIB_CRITICA = 8;
const DES_CRITICA = 5;

/* ================= DASHBOARD ================= */

export default function Dashboard() {
  const [temp, setTemp] = useState<number[]>([]);
  const [fftVib, setFftVib] = useState<number[]>([]);
  const [fftDes, setFftDes] = useState<number[]>([]);

  const [alertaTemp, setAlertaTemp] = useState(false);
  const [alertaVib, setAlertaVib] = useState(false);
  const [alertaDes, setAlertaDes] = useState(false);

  const vibracaoRef = useRef<NodeJS.Timeout | null>(null);
  const sireneRef = useRef<any>(null);

  /* ================= SIMULAÇÃO ================= */

  useEffect(() => {
    const interval = setInterval(() => {
      const t = 60 + Math.random() * 30;
      const vib = Array.from({ length: 32 }, () => Math.random() * 10);
      const des = Array.from({ length: 32 }, () => Math.random() * 6);

      const picoVib = Math.max(...vib);
      const picoDes = Math.max(...des);

      setTemp((p) => [...p.slice(-25), t]);
      setFftVib(vib);
      setFftDes(des);

      setAlertaTemp(t > TEMP_CRITICA);
      setAlertaVib(picoVib > VIB_CRITICA);
      setAlertaDes(picoDes > DES_CRITICA);

      if (
        (t > TEMP_CRITICA || picoVib > VIB_CRITICA || picoDes > DES_CRITICA) &&
        !sireneRef.current
      ) {
        iniciarAlerta();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  /* ================= ALERTA ================= */

  const iniciarAlerta = async () => {
    vibracaoRef.current = setInterval(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }, 1500);

    const player = createAudioPlayer(require("../../assets/alarm.mp3"));
    player.loop = true;
    player.play();
    sireneRef.current = player;
  };

  const pararAlerta = () => {
    setAlertaTemp(false);
    setAlertaVib(false);
    setAlertaDes(false);

    if (vibracaoRef.current) {
      clearInterval(vibracaoRef.current);
      vibracaoRef.current = null;
    }

    if (sireneRef.current) {
      sireneRef.current.pause();
      sireneRef.current.remove();
      sireneRef.current = null;
    }
  };

  /* ================= PDF ================= */

  const gerarRelatorioPDF = async () => {
    try {
      const html = `
      <html>
        <body style="font-family: Arial; padding: 24px;">
          <h2>Relatório de Monitoramento do Motor</h2>
          <p><b>Data:</b> ${new Date().toLocaleString()}</p>

          <h3>Status</h3>
          <ul>
            <li>Temperatura: ${temp.at(-1)?.toFixed(1)} °C</li>
            <li>Pico Vibração FFT: ${Math.max(...fftVib).toFixed(2)}</li>
            <li>Pico Desbalanceamento FFT: ${Math.max(...fftDes).toFixed(2)}</li>
          </ul>

          <h3>Alertas</h3>
          <ul>
            <li>Temperatura: ${alertaTemp ? "CRÍTICO" : "Normal"}</li>
            <li>Vibração: ${alertaVib ? "CRÍTICO" : "Normal"}</li>
            <li>Desbalanceamento: ${alertaDes ? "CRÍTICO" : "Normal"}</li>
          </ul>
        </body>
      </html>`;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch {
      Alert.alert("Erro", "Falha ao gerar PDF");
    }
  };

  const statusGeral =
    alertaTemp || alertaVib || alertaDes ? "CRÍTICO" : "NORMAL";

  /* ================= RENDER ================= */

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dashboard de Monitoramento</Text>
      <Text style={styles.subtitle}>Motor Industrial • Tempo Real</Text>

      {/* KPI */}
      <View style={styles.kpiRow}>
        <KPI
          title="Status Geral"
          value={statusGeral}
          danger={statusGeral === "CRÍTICO"}
        />
        <KPI
          title="Temperatura"
          value={`${temp.at(-1)?.toFixed(1) ?? "--"} °C`}
          danger={alertaTemp}
        />
      </View>

      {/* ALERTAS */}
      {(alertaTemp || alertaVib || alertaDes) && (
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>⚠ ALERTAS ATIVOS</Text>
          {alertaTemp && (
            <Text style={styles.alertItem}>🔥 Temperatura alta</Text>
          )}
          {alertaVib && (
            <Text style={styles.alertItem}>📈 Vibração excessiva</Text>
          )}
          {alertaDes && (
            <Text style={styles.alertItem}>⚖️ Desbalanceamento detectado</Text>
          )}

          <Pressable style={styles.alertBtn} onPress={pararAlerta}>
            <Text style={styles.alertTxt}>DESATIVAR ALERTAS</Text>
          </Pressable>
        </View>
      )}

      {/* GRÁFICOS */}
      <Card title="Temperatura do Motor">
        <Chart data={temp} max={100} color="#22c55e" />
      </Card>

      <Card title="FFT – Vibração">
        <Chart data={fftVib} max={10} color="#38bdf8" />
      </Card>

      <Card title="FFT – Desbalanceamento">
        <Chart data={fftDes} max={8} color="#facc15" />
      </Card>

      {/* PDF */}
      <Pressable style={styles.pdfBtn} onPress={gerarRelatorioPDF}>
        <Text style={styles.pdfTxt}>GERAR RELATÓRIO PDF</Text>
      </Pressable>
    </ScrollView>
  );
}

/* ================= COMPONENTES ================= */

function KPI({
  title,
  value,
  danger,
}: {
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
    <View style={[styles.kpiCard, danger && { borderColor: "#ef4444" }]}>
      <Text style={styles.kpiTitle}>{title}</Text>
      <Text style={[styles.kpiValue, danger && { color: "#ef4444" }]}>
        {value}
      </Text>
    </View>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Chart({
  data,
  max,
  color,
}: {
  data: number[];
  max: number;
  color: string;
}) {
  if (data.length < 2) return null;

  const points = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * GRAPH_WIDTH;
      const y = GRAPH_HEIGHT - (v / max) * GRAPH_HEIGHT;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <Svg width={GRAPH_WIDTH} height={GRAPH_HEIGHT}>
      <Polyline points={points} stroke={color} strokeWidth={2.5} fill="none" />
    </Svg>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#020617",
  },
  title: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "bold",
  },
  subtitle: {
    color: "#94a3b8",
    marginBottom: 20,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  kpiCard: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: CARD_RADIUS,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  kpiTitle: {
    color: "#94a3b8",
    fontSize: 12,
  },
  kpiValue: {
    color: "#22c55e",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 4,
  },
  alertBox: {
    backgroundColor: "#7f1d1d",
    padding: 16,
    borderRadius: CARD_RADIUS,
    marginBottom: 16,
  },
  alertTitle: {
    color: "#fecaca",
    fontWeight: "bold",
    marginBottom: 6,
  },
  alertItem: {
    color: "#fecaca",
    marginBottom: 4,
  },
  alertBtn: {
    backgroundColor: "#dc2626",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  alertTxt: {
    color: "#fff",
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#0f172a",
    borderRadius: CARD_RADIUS,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  cardTitle: {
    color: "#e5e7eb",
    fontWeight: "600",
    marginBottom: 8,
  },
  pdfBtn: {
    backgroundColor: "#2563eb",
    padding: 16,
    borderRadius: CARD_RADIUS,
    alignItems: "center",
    marginVertical: 24,
  },
  pdfTxt: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
