import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Client, Message } from "paho-mqtt";

// ===== MQTT CONFIG =====
const BROKER = "broker.hivemq.com";
const PORT = 8884; // WebSocket Secure
const PATH = "/mqtt";
const TOPIC = "eletromecanica/motor/sensores";

export default function Dashboard() {
  const [status, setStatus] = useState("🔴 Desconectado");
  const [dados, setDados] = useState<any>({});

  useEffect(() => {
    const clientId = "expo_" + Math.random().toString(16).slice(2);

    const client = new Client(BROKER, PORT, PATH, clientId);

    client.onConnectionLost = () => {
      console.log("❌ Conexão perdida");
      setStatus("🔴 Conexão perdida");
    };

    client.onMessageArrived = (message: Message) => {
      try {
        const json = JSON.parse(message.payloadString);
        setDados(json);
      } catch {
        console.warn("⚠️ JSON inválido");
      }
    };

    client.connect({
      useSSL: true,
      timeout: 5,
      onSuccess: () => {
        console.log("✅ MQTT conectado");
        setStatus("🟢 Conectado");
        client.subscribe(TOPIC);
      },
      onFailure: () => {
        console.log("❌ Falha ao conectar");
        setStatus("🔴 Falha MQTT");
      },
    });

    return () => {
      if (client.isConnected()) {
        client.disconnect();
      }
    };
  }, []);

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>⚙️ Monitoramento do Motor</Text>
      <Text style={styles.status}>{status}</Text>

      <View style={styles.card}>
        <Text style={styles.item}>🌡️ Temp: {dados.temp ?? "--"} °C</Text>
        <Text style={styles.item}>📈 Ax: {dados.ax ?? "--"}</Text>
        <Text style={styles.item}>📈 Ay: {dados.ay ?? "--"}</Text>
        <Text style={styles.item}>📈 Az: {dados.az ?? "--"}</Text>
      </View>
    </ScrollView>
  );
}

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#020617",
    flex: 1,
  },
  title: {
    color: "#fff",
    fontSize: 22,
    marginBottom: 10,
    fontWeight: "bold",
  },
  status: {
    color: "#94a3b8",
    marginBottom: 12,
  },
  card: {
    backgroundColor: "#020617",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#1e293b",
    padding: 16,
  },
  item: {
    color: "#e5e7eb",
    fontSize: 18,
    marginBottom: 6,
  },
});
