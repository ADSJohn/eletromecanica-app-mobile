import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import Svg, { Polyline, Line } from "react-native-svg";
import { Client, Message } from "paho-mqtt";

const { width } = Dimensions.get("window");
const W = width - 32;
const H = 160;

const TEMP_IDEAL = 70;
const TEMP_MIN = 0;
const TEMP_MAX = 120;

export default function Dashboard() {
  const [tempSeries, setTempSeries] = useState<number[]>([]);
  const [fftVib, setFftVib] = useState<number[]>([]);
  const [fftDes, setFftDes] = useState<number[]>([]);
  const [status, setStatus] = useState("🔴 Desconectado");

  useEffect(() => {
    const client = new Client(
      "broker.hivemq.com",
      8884,
      "/mqtt",
      "expo_" + Math.random().toString(16).slice(2),
    );

    client.onMessageArrived = (m: Message) => {
      const d = JSON.parse(m.payloadString);

      if (d.temp !== undefined) {
        setTempSeries((t) => [...t.slice(-60), Number(d.temp)]);
      }

      if (Array.isArray(d.fft)) {
        if (m.destinationName.includes("vibracao")) setFftVib(d.fft);
        if (m.destinationName.includes("desbalanceamento")) setFftDes(d.fft);
      }
    };

    client.connect({
      useSSL: true,
      onSuccess: () => {
        setStatus("🟢 MQTT conectado");
        client.subscribe("eletromecanica/motor/raw");
        client.subscribe("eletromecanica/motor/fft/vibracao");
        client.subscribe("eletromecanica/motor/fft/desbalanceamento");
      },
    });

    return () => client.disconnect();
  }, []);

  /* ===========================
     GRÁFICO DE TEMPERATURA
     =========================== */
  const drawTemp = () => {
    if (tempSeries.length < 2) return null;

    const toPoint = (v: number, i: number) => {
      const x = (i / (tempSeries.length - 1)) * W;
      const y = H - ((v - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * H;
      return `${x},${y}`;
    };

    const idealY = H - ((TEMP_IDEAL - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * H;

    return (
      <Svg width={W} height={H}>
        {/* Linha do sensor */}
        <Polyline
          points={tempSeries.map(toPoint).join(" ")}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
        />

        {/* Linha ideal */}
        <Line
          x1={0}
          x2={W}
          y1={idealY}
          y2={idealY}
          stroke="#ef4444"
          strokeWidth={2}
          strokeDasharray="6 4"
        />
      </Svg>
    );
  };

  /* ===========================
     FFT GENÉRICA
     =========================== */
  const drawFFT = (data: number[], color: string) => {
    if (data.length < 2) return null;

    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;

    const points = data
      .map((v, i) => {
        const x = (i / (data.length - 1)) * W;
        const y = H - ((v - min) / range) * H;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <Svg width={W} height={H}>
        <Polyline points={points} stroke={color} strokeWidth={2} fill="none" />
      </Svg>
    );
  };

  /* ===========================
     LEGENDA
     =========================== */
  const Legend = ({ items }: any) => (
    <View style={styles.legend}>
      {items.map((i: any) => (
        <View key={i.label} style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: i.color }]} />
          <Text style={styles.legendText}>{i.label}</Text>
        </View>
      ))}
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>⚙️ Monitoramento do Motor</Text>
      <Text style={styles.status}>{status}</Text>

      {/* TEMPERATURA */}
      <View style={styles.card}>
        <Text style={styles.label}>🌡️ Temperatura do Motor</Text>
        <Legend
          items={[
            { label: "Sensor", color: "#22c55e" },
            { label: "Ideal", color: "#ef4444" },
          ]}
        />
        {drawTemp()}
      </View>

      {/* VIBRAÇÃO */}
      <View style={styles.card}>
        <Text style={styles.label}>📈 FFT Vibração</Text>
        <Legend items={[{ label: "Acelerômetro (Z)", color: "#38bdf8" }]} />
        {drawFFT(fftVib, "#38bdf8")}
      </View>

      {/* DESBALANCEAMENTO */}
      <View style={styles.card}>
        <Text style={styles.label}>⚖️ FFT Desbalanceamento</Text>
        <Legend items={[{ label: "Campo Magnético (X)", color: "#facc15" }]} />
        {drawFFT(fftDes, "#facc15")}
      </View>
    </ScrollView>
  );
}

/* ===========================
   ESTILOS
   =========================== */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#020617",
    padding: 16,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  status: {
    color: "#94a3b8",
    marginBottom: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 12,
    marginBottom: 16,
    borderRadius: 8,
  },
  label: {
    color: "#e5e7eb",
    marginBottom: 4,
    fontWeight: "600",
  },
  legend: {
    flexDirection: "row",
    marginBottom: 6,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 12,
  },
  legendColor: {
    width: 12,
    height: 12,
    marginRight: 6,
  },
  legendText: {
    color: "#cbd5f5",
    fontSize: 12,
  },
});
