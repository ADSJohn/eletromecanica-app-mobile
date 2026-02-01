import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
} from "react-native";
import Svg, { Polyline, Line, Text as SvgText } from "react-native-svg";
import { Client, Message } from "paho-mqtt";
import { startAlarm, stopAlarm } from "../services/alarmSound";

/* ================= CONFIG ================= */

const { width } = Dimensions.get("window");

const CARD_WIDTH = width - 32;
const GRAPH_WIDTH = CARD_WIDTH - 60;
const GRAPH_HEIGHT = 160;

const OFFSET_X = 50;
const OFFSET_Y = 10;

const TEMP_IDEAL = 20;
const TEMP_MIN = 0;
const TEMP_MAX = 120;
const TEMP_CRITICA = 85;

/* ================= COMPONENT ================= */

export default function Dashboard() {
  const [tempSeries, setTempSeries] = useState<number[]>([]);
  const [fftVib, setFftVib] = useState<number[]>([]);
  const [fftDes, setFftDes] = useState<number[]>([]);
  const [status, setStatus] = useState("🔴 Desconectado");

  const [alerta, setAlerta] = useState<string | null>(null);
  const [alarmeAtivo, setAlarmeAtivo] = useState(false);
  const [alarmeAck, setAlarmeAck] = useState(false);

  /* ================= MQTT ================= */

  useEffect(() => {
    const client = new Client(
      "broker.hivemq.com",
      8884,
      "/mqtt",
      "expo_" + Math.random().toString(16).slice(2),
    );

    client.onMessageArrived = (msg: Message) => {
      const data = JSON.parse(msg.payloadString);

      // TEMPERATURA
      if (data.temp !== undefined) {
        setTempSeries((t) => [...t.slice(-60), Number(data.temp)]);

        if (data.temp > TEMP_CRITICA && !alarmeAtivo && !alarmeAck) {
          setAlerta("Temperatura acima do limite crítico");
          setAlarmeAtivo(true);
          startAlarm();
        }
      }

      // FFT
      if (Array.isArray(data.fft)) {
        if (msg.destinationName.includes("vibracao")) setFftVib(data.fft);
        if (msg.destinationName.includes("desbalanceamento"))
          setFftDes(data.fft);
      }

      // ALERTA DO BACKEND
      if (msg.destinationName.includes("alerta")) {
        if (!alarmeAtivo && !alarmeAck) {
          setAlerta(data.mensagem);
          setAlarmeAtivo(true);
          startAlarm();
        }
      }
    };

    client.connect({
      useSSL: true,
      onSuccess: () => {
        setStatus("🟢 MQTT conectado");
        client.subscribe("eletromecanica/motor/raw");
        client.subscribe("eletromecanica/motor/fft/vibracao");
        client.subscribe("eletromecanica/motor/fft/desbalanceamento");
        client.subscribe("eletromecanica/motor/alerta");
      },
    });

    return () => client.disconnect();
  }, [alarmeAtivo, alarmeAck]);

  /* ================= RESET ACK ================= */
  useEffect(() => {
    const t = tempSeries[tempSeries.length - 1];
    if (t !== undefined && t < TEMP_CRITICA) {
      setAlarmeAck(false);
    }
  }, [tempSeries]);

  /* ================= AXES ================= */

  const Axes = ({
    yLabels,
    xLabel,
    yLabel,
  }: {
    yLabels: string[];
    xLabel: string;
    yLabel: string;
  }) => (
    <>
      <Line
        x1={OFFSET_X}
        y1={OFFSET_Y}
        x2={OFFSET_X}
        y2={GRAPH_HEIGHT + OFFSET_Y}
        stroke="#475569"
      />
      <Line
        x1={OFFSET_X}
        y1={GRAPH_HEIGHT + OFFSET_Y}
        x2={OFFSET_X + GRAPH_WIDTH}
        y2={GRAPH_HEIGHT + OFFSET_Y}
        stroke="#475569"
      />

      {yLabels.map((l, i) => {
        const y =
          OFFSET_Y + GRAPH_HEIGHT - (i / (yLabels.length - 1)) * GRAPH_HEIGHT;

        return (
          <SvgText
            key={l}
            x={OFFSET_X - 6}
            y={y + 4}
            fontSize="10"
            fill="#cbd5f5"
            textAnchor="end"
          >
            {l}
          </SvgText>
        );
      })}

      <SvgText
        x={OFFSET_X + GRAPH_WIDTH / 2}
        y={GRAPH_HEIGHT + OFFSET_Y + 28}
        fontSize="11"
        fill="#cbd5f5"
        textAnchor="middle"
      >
        {xLabel}
      </SvgText>

      <SvgText
        x={12}
        y={OFFSET_Y + GRAPH_HEIGHT / 2}
        fontSize="11"
        fill="#cbd5f5"
        transform={`rotate(-90 12 ${OFFSET_Y + GRAPH_HEIGHT / 2})`}
        textAnchor="middle"
      >
        {yLabel}
      </SvgText>
    </>
  );

  /* ================= TEMP CHART ================= */

  const TempChart = () => {
    if (tempSeries.length < 2) return null;

    const ideal = tempSeries.map(() => TEMP_IDEAL);

    const toPoint = (v: number, i: number) => {
      const x = OFFSET_X + (i / (tempSeries.length - 1)) * GRAPH_WIDTH;
      const y =
        OFFSET_Y +
        GRAPH_HEIGHT -
        ((v - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * GRAPH_HEIGHT;
      return `${x},${y}`;
    };

    return (
      <Svg width={CARD_WIDTH} height={GRAPH_HEIGHT + 60}>
        <Axes
          yLabels={["0", "30", "60", "90", "120"]}
          xLabel="Tempo"
          yLabel="°C"
        />
        <Polyline
          points={tempSeries.map(toPoint).join(" ")}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
        />
        <Polyline
          points={ideal.map(toPoint).join(" ")}
          stroke="#ef4444"
          strokeWidth={2}
          strokeDasharray="6 4"
          fill="none"
        />
      </Svg>
    );
  };

  /* ================= FFT CHART ================= */

  const FFTChart = (data: number[], color: string, label: string) => {
    if (!data || data.length < 2) return null;

    const max = Math.max(...data);

    const toPoint = (v: number, i: number) => {
      const x = OFFSET_X + (i / (data.length - 1)) * GRAPH_WIDTH;
      const y = OFFSET_Y + GRAPH_HEIGHT - (v / max) * GRAPH_HEIGHT;
      return `${x},${y}`;
    };

    return (
      <Svg width={CARD_WIDTH} height={GRAPH_HEIGHT + 60}>
        <Axes
          yLabels={["0", "25%", "50%", "75%", "100%"]}
          xLabel="Frequência"
          yLabel={label}
        />
        <Polyline
          points={data.map(toPoint).join(" ")}
          stroke={color}
          strokeWidth={2}
          fill="none"
        />
      </Svg>
    );
  };

  /* ================= JSX ================= */

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>⚙️ Monitoramento do Motor</Text>
      <Text style={styles.status}>{status}</Text>

      {alerta && (
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>🚨 ALERTA CRÍTICO</Text>
          <Text style={styles.alertMsg}>{alerta}</Text>

          <Pressable
            style={styles.alertBtn}
            onPress={() => {
              stopAlarm();
              setAlarmeAtivo(false);
              setAlarmeAck(true);
              setAlerta(null);
            }}
          >
            <Text style={styles.alertBtnText}>PARAR ALARME</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>🌡️ Temperatura</Text>
        <TempChart />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>📈 FFT Vibração</Text>
        {FFTChart(fftVib, "#38bdf8", "Magnitude")}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>⚖️ FFT Desbalanceamento</Text>
        {FFTChart(fftDes, "#facc15", "Magnitude")}
      </View>
    </ScrollView>
  );
}

/* ================= STYLES ================= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617", padding: 16 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  status: { color: "#94a3b8", marginBottom: 12 },

  card: {
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },

  label: { color: "#e5e7eb", fontWeight: "600", marginBottom: 6 },

  alertBox: {
    backgroundColor: "#7f1d1d",
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  alertTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  alertMsg: { color: "#fecaca", marginVertical: 8 },
  alertBtn: {
    backgroundColor: "#dc2626",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
  },
  alertBtnText: { color: "#fff", fontWeight: "bold" },
});
