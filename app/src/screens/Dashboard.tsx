import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import mqtt from "mqtt";
import { LineChart, BarChart } from "react-native-chart-kit";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const screenWidth = Dimensions.get("window").width;

export default function App() {
  const [data, setData] = useState(null);
  const [temperatura, setTemperatura] = useState(0);

  useEffect(() => {
    const client = mqtt.connect(
      "wss://5ae001f71edd4b68ae00ad6c224e33c2.s1.eu.hivemq.cloud:8884/mqtt",
      {
        username: "boracodardevs",
        password: "@4Elementosderua",
      },
    );

    client.on("connect", () => {
      client.subscribe("DSP");
      client.subscribe("sensor_temperatura_DS18B20");
    });

    client.on("message", (topic, message) => {
      if (topic === "DSP") {
        setData(JSON.parse(message.toString()));
      }

      if (topic === "sensor_temperatura_DS18B20") {
        const tempJson = JSON.parse(message.toString());
        setTemperatura(tempJson.temperatura);
      }
    });

    return () => client.end();
  }, []);

  /* ================= PDF ================= */

  const gerarRelatorio = async () => {
    if (!data) {
      Alert.alert("Sem dados", "Aguardando informações do sistema.");
      return;
    }

    const rpm = data.device_info?.rpm || 0;
    const freq1x = rpm / 60;
    const freq2x = freq1x * 2;
    const freq3x = freq1x * 3;

    const html = `
      <html>
      <body style="font-family: Arial; padding:20px;">
        <h1>Relatório Industrial</h1>
        <h2>Índice de Saúde: ${data.health_index_percent.toFixed(0)}%</h2>
        <h2>Temperatura: ${temperatura.toFixed(1)}°C</h2>
        <h3>Harmônicas</h3>
        <p>1x RPM: ${freq1x.toFixed(2)} Hz</p>
        <p>2x RPM: ${freq2x.toFixed(2)} Hz</p>
        <p>3x RPM: ${freq3x.toFixed(2)} Hz</p>
      </body>
      </html>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Aguardando dados da DSP...</Text>
      </View>
    );
  }

  const rpm = data.device_info?.rpm || 0;
  const freq1x = rpm / 60;
  const freq2x = freq1x * 2;
  const freq3x = freq1x * 3;

  const health = data.health_index_percent;
  const magneticDeviation = data.magnetic_analysis?.heading_std_deviation || 0;

  const healthColor =
    health > 80
      ? "#00c853"
      : health > 60
        ? "#ffb300"
        : health > 40
          ? "#ff6d00"
          : "#d50000";

  const tempColor =
    temperatura <= 50 ? "#00c853" : temperatura <= 70 ? "#ffb300" : "#d50000";

  const chartConfig = {
    backgroundGradientFrom: "#1a1a1a",
    backgroundGradientTo: "#1a1a1a",
    decimalPlaces: 2,
    color: () => "#ffa500",
    labelColor: () => "#fff",
  };

  return (
    <ScrollView style={styles.container}>
      {/* HEADER */}
      <View style={styles.headerContainer}>
        <Text style={styles.header}>🏭 PAINEL SCADA INDUSTRIAL</Text>
        <TouchableOpacity style={styles.pdfButton} onPress={gerarRelatorio}>
          <Icon name="file-pdf-box" size={22} color="#fff" />
          <Text style={styles.pdfText}>Relatório</Text>
        </TouchableOpacity>
      </View>

      {/* STATUS GERAL */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={styles.metricFull}>
            <Icon name="heart-pulse" size={22} color={healthColor} />
            <Text style={[styles.bigValue, { color: healthColor }]}>
              {health.toFixed(0)}%
            </Text>
            <Text style={styles.label}>Índice de Saúde</Text>
          </View>

          <View style={styles.metricFull}>
            <Icon name="thermometer" size={22} color={tempColor} />
            <Text style={[styles.bigValue, { color: tempColor }]}>
              {temperatura.toFixed(1)}°C
            </Text>
            <Text style={styles.label}>Temperatura</Text>
          </View>
        </View>
      </View>

      {/* HARMÔNICAS */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>⚙ Harmônicas do Eixo</Text>

        <View style={styles.row}>
          <Metric
            icon="speedometer"
            label="1x RPM"
            value={`${freq1x.toFixed(2)} Hz`}
          />
          <Metric
            icon="speedometer-medium"
            label="2x RPM"
            value={`${freq2x.toFixed(2)} Hz`}
          />
        </View>

        <View style={styles.row}>
          <Metric
            icon="speedometer-slow"
            label="3x RPM"
            value={`${freq3x.toFixed(2)} Hz`}
          />
          <Metric icon="rotate-right" label="RPM" value={`${rpm.toFixed(0)}`} />
        </View>

        <BarChart
          data={{
            labels: ["1x", "2x", "3x"],
            datasets: [
              {
                data: [freq1x, freq2x, freq3x],
              },
            ],
          }}
          width={screenWidth - 40}
          height={180}
          chartConfig={chartConfig}
        />
      </View>

      {/* VIBRAÇÃO */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>📈 Vibração</Text>

        <View style={styles.row}>
          <Metric
            icon="waveform"
            label="RMS"
            value={`${data.time_domain.rms.toFixed(2)} g`}
          />
          <Metric
            icon="arrow-collapse-up"
            label="Pico"
            value={`${data.time_domain.peak.toFixed(2)} g`}
          />
        </View>
      </View>

      {/* FALHAS */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>🔎 Rolamentos</Text>

        <BarChart
          data={{
            labels: ["BPFO", "BPFI"],
            datasets: [
              {
                data: [
                  data.bearing_fault_frequencies.BPFO.measured_amplitude,
                  data.bearing_fault_frequencies.BPFI.measured_amplitude,
                ],
              },
            ],
          }}
          width={screenWidth - 40}
          height={180}
          chartConfig={chartConfig}
        />
      </View>

      {/* MAGNÉTICO */}
      <View style={styles.card}>
        <View style={styles.rowCenter}>
          <Icon name="compass" size={26} color="#00e5ff" />
          <Text style={styles.magneticValue}>
            {magneticDeviation.toFixed(2)}°
          </Text>
          <Text style={styles.label}>Desvio Magnético</Text>
        </View>
      </View>
    </ScrollView>
  );
}

/* COMPONENTE MÉTRICA */

const Metric = ({ icon, label, value }) => (
  <View style={styles.metricBox}>
    <Icon name={icon} size={18} color="#00e5ff" />
    <Text style={styles.metricValue}>{value}</Text>
    <Text style={styles.metricLabel}>{label}</Text>
  </View>
);

/* ================= ESTILOS ================= */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    padding: 15,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0d0d0d",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    alignItems: "center",
  },
  header: {
    fontSize: 16,
    color: "#00e5ff",
    fontWeight: "bold",
  },
  pdfButton: {
    flexDirection: "row",
    backgroundColor: "#d50000",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: "center",
  },
  pdfText: {
    color: "#fff",
    marginLeft: 6,
    fontSize: 12,
  },
  card: {
    backgroundColor: "#1c1c1c",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 12,
    fontWeight: "600",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  rowBetween: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rowCenter: {
    alignItems: "center",
  },
  metricBox: {
    backgroundColor: "#2a2a2a",
    padding: 12,
    borderRadius: 10,
    width: "48%",
    alignItems: "center",
  },
  metricLabel: {
    color: "#aaa",
    fontSize: 11,
    marginTop: 4,
  },
  metricValue: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
    marginTop: 4,
  },
  metricFull: {
    alignItems: "center",
    width: "48%",
  },
  bigValue: {
    fontSize: 26,
    fontWeight: "bold",
  },
  label: {
    color: "#aaa",
    fontSize: 12,
    marginTop: 4,
  },
  magneticValue: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 6,
  },
});
