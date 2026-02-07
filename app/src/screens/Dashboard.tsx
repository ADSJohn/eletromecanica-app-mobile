import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Pressable,
  Alert,
  SafeAreaView,
  Platform,
  StatusBar,
} from "react-native";
import Svg, { Polyline, Line, Text as SvgText } from "react-native-svg";
import * as Haptics from "expo-haptics";
import { createAudioPlayer } from "expo-audio";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { MaterialCommunityIcons } from "@expo/vector-icons";

/* ================= DIMENSÕES ================= */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const STATUS_BAR_HEIGHT =
  Platform.OS === "android" ? (StatusBar.currentHeight ?? 0) : 0;

/* ================= LIMITES ================= */

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

  const [alarmeAtivo, setAlarmeAtivo] = useState(true);

  const vibracaoRef = useRef<NodeJS.Timeout | null>(null);
  const sireneRef = useRef<any>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const t = 60 + Math.random() * 30;
      const vib = Array.from({ length: 32 }, () => Math.random() * 10);
      const des = Array.from({ length: 32 }, () => Math.random() * 6);

      setTemp((p) => [...p.slice(-5), t]);
      setFftVib(vib);
      setFftDes(des);

      setAlertaTemp(t > TEMP_CRITICA);
      setAlertaVib(Math.max(...vib) > VIB_CRITICA);
      setAlertaDes(Math.max(...des) > DES_CRITICA);

      if (
        (t > TEMP_CRITICA ||
          Math.max(...vib) > VIB_CRITICA ||
          Math.max(...des) > DES_CRITICA) &&
        alarmeAtivo
      ) {
        iniciarAlarme();
      } else {
        pararAlarme();
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [alarmeAtivo]);

  const iniciarAlarme = async () => {
    if (!sireneRef.current) {
      vibracaoRef.current = setInterval(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }, 1500);

      const player = createAudioPlayer(require("../../assets/alarm.mp3"));
      player.loop = true;
      player.play();
      sireneRef.current = player;
    }
  };

  const pararAlarme = () => {
    if (vibracaoRef.current) clearInterval(vibracaoRef.current);
    if (sireneRef.current) {
      sireneRef.current.pause();
      sireneRef.current.remove();
    }
    vibracaoRef.current = null;
    sireneRef.current = null;
  };

  const gerarRelatorioPDF = async () => {
    try {
      const html = `
      <html>
        <body style="font-family: Arial; padding: 24px;">
          <h2>Relatório de Monitoramento</h2>
          <p>Temperatura: ${temp.at(-1)?.toFixed(1)} °C</p>
          <p>FFT Vibração (pico): ${Math.max(...fftVib).toFixed(2)}</p>
          <p>FFT Desbalanceamento (pico): ${Math.max(...fftDes).toFixed(2)}</p>
        </body>
      </html>`;
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri);
    } catch {
      Alert.alert("Erro", "Falha ao gerar relatório");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Dashboard de Monitoramento</Text>
            <Text style={styles.subtitle}>Motor Industrial • Tempo Real</Text>
          </View>

          <View style={styles.headerBtns}>
            <Pressable style={styles.iconBtn} onPress={gerarRelatorioPDF}>
              <MaterialCommunityIcons
                name="file-pdf-box"
                size={22}
                color="#ef4444"
              />
              <Text style={styles.btnTxt}>Relatório</Text>
            </Pressable>

            <Pressable
              style={styles.iconBtn}
              onPress={() => {
                setAlarmeAtivo((p) => !p);
                pararAlarme();
              }}
            >
              <MaterialCommunityIcons
                name={alarmeAtivo ? "alarm-light" : "alarm-light-off"}
                size={22}
                color={alarmeAtivo ? "#22c55e" : "#94a3b8"}
              />
              <Text style={styles.btnTxt}>
                {alarmeAtivo ? "Alarme ON" : "Alarme OFF"}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* KPI */}
        <View style={styles.kpi}>
          <Text style={styles.kpiLabel}>Temperatura Atual</Text>
          <View style={styles.kpiRow}>
            <Text style={[styles.kpiValue, alertaTemp && { color: "#ef4444" }]}>
              {temp.at(-1)?.toFixed(1) ?? "--"} °C
            </Text>
            <StatusLed danger={alertaTemp} />
          </View>
        </View>

        {/* GRÁFICOS */}
        <View style={styles.graphGrid}>
          <GraphCard
            title="FFT – Vibração"
            data={fftVib}
            max={10}
            danger={alertaVib}
            yLabel="Amplitude"
            xLabel="Frequência"
          />
          <GraphCard
            title="FFT – Desbalanceamento"
            data={fftDes}
            max={8}
            danger={alertaDes}
            yLabel="Amplitude"
            xLabel="Frequência"
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

/* ================= COMPONENTES ================= */

function StatusLed({ danger }: { danger: boolean }) {
  return (
    <View style={[styles.led, danger ? styles.ledDanger : styles.ledOk]} />
  );
}

function GraphCard({ title, data, max, danger, xLabel, yLabel }: any) {
  const graphHeight = SCREEN_HEIGHT * 0.24;
  const graphWidth = SCREEN_WIDTH - 32;

  const paddingLeft = 42;
  const paddingBottom = 30;
  const paddingTop = 10;
  const paddingRight = 10;

  if (!data || data.length < 2) return null;

  const points = data
    .map((v: number, i: number) => {
      const x =
        paddingLeft +
        (i / (data.length - 1)) * (graphWidth - paddingLeft - paddingRight);
      const y =
        paddingTop + (1 - v / max) * (graphHeight - paddingTop - paddingBottom);
      return `${x},${y}`;
    })
    .join(" ");

  const ticksY = 4;
  const ticksX = 4;

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <StatusLed danger={danger} />
      </View>

      <Svg width={graphWidth} height={graphHeight}>
        {/* EIXOS */}
        <Line
          x1={paddingLeft}
          y1={paddingTop}
          x2={paddingLeft}
          y2={graphHeight - paddingBottom}
          stroke="#475569"
        />
        <Line
          x1={paddingLeft}
          y1={graphHeight - paddingBottom}
          x2={graphWidth - paddingRight}
          y2={graphHeight - paddingBottom}
          stroke="#475569"
        />

        {/* Y TICKS */}
        {Array.from({ length: ticksY + 1 }).map((_, i) => {
          const y =
            paddingTop +
            (i / ticksY) * (graphHeight - paddingTop - paddingBottom);
          const value = (max * (ticksY - i)) / ticksY;
          return (
            <React.Fragment key={i}>
              <Line
                x1={paddingLeft - 4}
                y1={y}
                x2={paddingLeft}
                y2={y}
                stroke="#475569"
              />
              <SvgText
                x={paddingLeft - 8}
                y={y + 4}
                fontSize="10"
                fill="#94a3b8"
                textAnchor="end"
              >
                {value.toFixed(0)}
              </SvgText>
            </React.Fragment>
          );
        })}

        {/* X TICKS */}
        {Array.from({ length: ticksX + 1 }).map((_, i) => {
          const x =
            paddingLeft +
            (i / ticksX) * (graphWidth - paddingLeft - paddingRight);
          return (
            <SvgText
              key={i}
              x={x}
              y={graphHeight - paddingBottom + 14}
              fontSize="10"
              fill="#94a3b8"
              textAnchor="middle"
            >
              {Math.round((data.length * i) / ticksX)}
            </SvgText>
          );
        })}

        {/* LINHA */}
        <Polyline
          points={points}
          stroke={danger ? "#ef4444" : "#38bdf8"}
          strokeWidth={2.5}
          fill="none"
        />

        {/* LEGENDAS */}
        <SvgText
          x={graphWidth / 2}
          y={graphHeight - 4}
          fontSize="10"
          fill="#94a3b8"
          textAnchor="middle"
        >
          {xLabel}
        </SvgText>

        <SvgText
          x={12}
          y={graphHeight / 2}
          fontSize="10"
          fill="#94a3b8"
          textAnchor="middle"
          rotation="-90"
          origin={`12,${graphHeight / 2}`}
        >
          {yLabel}
        </SvgText>
      </Svg>
    </View>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#020617" },
  container: { flex: 1, paddingHorizontal: 14 },

  header: {
    marginTop: STATUS_BAR_HEIGHT,
    height: 64,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  headerBtns: { flexDirection: "row", gap: 14 },

  title: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  subtitle: { color: "#94a3b8", fontSize: 12 },

  iconBtn: { alignItems: "center" },
  btnTxt: { fontSize: 10, color: "#e5e7eb" },

  kpi: {
    marginVertical: 8,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#1e293b",
  },

  kpiLabel: { color: "#94a3b8", fontSize: 12 },

  kpiRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },

  kpiValue: {
    fontSize: 30,
    fontWeight: "bold",
    color: "#22c55e",
  },

  graphGrid: { flex: 1, gap: 8 },

  card: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
  },

  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },

  cardTitle: { color: "#e5e7eb", fontWeight: "600" },

  led: { borderRadius: 50 },
  ledOk: { width: 10, height: 10, backgroundColor: "#22c55e" },
  ledDanger: { width: 16, height: 16, backgroundColor: "#ef4444" },
});
