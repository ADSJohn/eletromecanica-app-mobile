import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import Svg, { Polyline } from "react-native-svg";
import { Client, Message } from "paho-mqtt";

const { width } = Dimensions.get("window");
const W = width - 32;
const H = 160;

const TEMP_IDEAL = 20;

export default function Dashboard() {
  const [temp, setTemp] = useState<number[]>([]);
  const [vib, setVib] = useState<number[]>([]);
  const [des, setDes] = useState<number[]>([]);
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

      if (d.temp !== undefined) setTemp((t) => [...t.slice(-50), d.temp]);

      if (Array.isArray(d.fft)) {
        if (m.destinationName.includes("vibracao")) setVib(d.fft);
        if (m.destinationName.includes("desbalanceamento")) setDes(d.fft);
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

  const line = (data: number[], color: string, fixed?: number) => {
    if (data.length < 2) return null;

    const min = Math.min(...data, fixed ?? Infinity);
    const max = Math.max(...data, fixed ?? -Infinity);
    const range = max - min || 1;

    const build = (v: number, i: number) =>
      `${(i / (data.length - 1)) * W},${H - ((v - min) / range) * H}`;

    return (
      <Svg width={W} height={H}>
        <Polyline
          points={data.map(build).join(" ")}
          stroke={color}
          strokeWidth={2}
          fill="none"
        />
        {fixed !== undefined && (
          <Polyline
            points={data.map((_, i) => build(fixed, i)).join(" ")}
            stroke="#f87171"
            strokeWidth={1}
            fill="none"
          />
        )}
      </Svg>
    );
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>⚙️ Monitoramento do Motor</Text>
      <Text style={styles.status}>{status}</Text>

      <View style={styles.card}>
        <Text style={styles.label}>🌡️ Temperatura (Ideal x Sensor)</Text>
        {line(temp, "#22c55e", TEMP_IDEAL)}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>📈 FFT Vibração</Text>
        {line(vib, "#38bdf8")}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>⚖️ FFT Desbalanceamento</Text>
        {line(des, "#facc15")}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617", padding: 16 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold" },
  status: { color: "#94a3b8", marginBottom: 12 },
  card: {
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 12,
    marginBottom: 16,
  },
  label: { color: "#e5e7eb", marginBottom: 6 },
});
