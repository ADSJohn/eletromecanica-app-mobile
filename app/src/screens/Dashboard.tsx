import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, Dimensions, ScrollView } from "react-native";
import mqtt from "mqtt";
import { LineChart, BarChart } from "react-native-chart-kit";
import Svg, { Path } from "react-native-svg";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

const screenWidth = Dimensions.get("window").width;

export default function App() {
  const [data, setData] = useState(null);
  const [temperatura, setTemperatura] = useState(0);
  const [healthHistory, setHealthHistory] = useState([]);

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
        const json = JSON.parse(message.toString());
        setData(json);
        setHealthHistory((prev) => [
          ...prev.slice(-20),
          json.health_index_percent,
        ]);
      }

      if (topic === "sensor_temperatura_DS18B20") {
        const tempJson = JSON.parse(message.toString());
        setTemperatura(tempJson.temperatura);
      }
    });

    return () => client.end();
  }, []);

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Aguardando dados...</Text>
      </View>
    );
  }

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
    color: (opacity = 1) => `rgba(255,165,0,${opacity})`,
    labelColor: () => "#fff",
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <Text style={styles.header}>PAINEL INDUSTRIAL</Text>

      {/* ===== TEMPERATURA (MENOR) ===== */}
      <View style={styles.cardSmall}>
        <Text style={styles.sectionTitle}>Temperatura</Text>
        <View style={styles.gaugeWrapper}>
          <Gauge value={temperatura} max={100} color={tempColor} size={160} />
          <Icon
            name="thermometer"
            size={22}
            color={tempColor}
            style={{ position: "absolute", top: 30 }}
          />
          <Text style={styles.gaugeText}>{temperatura}°C</Text>
        </View>
      </View>

      {/* ===== SAÚDE DO MOTOR ===== */}
      <View style={styles.cardLarge}>
        <Text style={styles.sectionTitle}>Índice de Saúde</Text>
        <View style={styles.gaugeWrapper}>
          <Gauge value={health} max={100} color={healthColor} size={220} />
          <Text style={styles.gaugeTextLarge}>{health}%</Text>
        </View>
      </View>

      {/* ===== VIBRAÇÃO ===== */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Análise de Vibração</Text>

        <View style={styles.row}>
          <Metric label="RMS" value={`${data.time_domain.rms} g`} />
          <Metric label="Pico" value={`${data.time_domain.peak} g`} />
        </View>

        <LineChart
          data={{
            labels: ["RMS", "Pico"],
            datasets: [{ data: [data.time_domain.rms, data.time_domain.peak] }],
          }}
          width={screenWidth - 40}
          height={180}
          chartConfig={chartConfig}
          withDots={false}
        />
      </View>

      {/* ===== FALHAS DE ROLAMENTO ===== */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Falhas de Rolamento</Text>

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

      {/* ===== DESVIO MAGNÉTICO ===== */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Desvio Magnético</Text>

        <View style={styles.magneticBox}>
          <Icon name="compass" size={28} color="#00e5ff" />
          <Text style={styles.magneticValue}>
            {magneticDeviation.toFixed(2)} °
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

/* ================= COMPONENTES ================= */

const Metric = ({ label, value }) => (
  <View style={styles.metricBox}>
    <Text style={styles.metricLabel}>{label}</Text>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const Gauge = ({ value, max, color, size }) => {
  const angle = (value / max) * 180;
  const radius = size / 2 - 20;

  const polarToCartesian = (cx, cy, r, angle) => {
    const rad = (angle - 90) * (Math.PI / 180);
    return {
      x: cx + r * Math.cos(rad),
      y: cy + r * Math.sin(rad),
    };
  };

  const describeArc = (x, y, r, startAngle, endAngle) => {
    const start = polarToCartesian(x, y, r, endAngle);
    const end = polarToCartesian(x, y, r, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return `M ${start.x} ${start.y}
            A ${r} ${r} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
  };

  return (
    <Svg width={size} height={size / 1.7}>
      <Path
        d={describeArc(size / 2, size / 2, radius, 0, 180)}
        stroke="#333"
        strokeWidth="18"
        fill="none"
      />
      <Path
        d={describeArc(size / 2, size / 2, radius, 0, angle)}
        stroke={color}
        strokeWidth="18"
        fill="none"
      />
    </Svg>
  );
};

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
  header: {
    fontSize: 18,
    color: "#00e5ff",
    textAlign: "center",
    marginBottom: 15,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#1c1c1c",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  cardSmall: {
    backgroundColor: "#1c1c1c",
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
    alignItems: "center",
  },
  cardLarge: {
    backgroundColor: "#1c1c1c",
    padding: 20,
    borderRadius: 14,
    marginBottom: 20,
    alignItems: "center",
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 10,
    fontWeight: "600",
  },
  gaugeWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  gaugeText: {
    position: "absolute",
    top: 45,
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  gaugeTextLarge: {
    position: "absolute",
    top: 65,
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  metricBox: {
    backgroundColor: "#2a2a2a",
    padding: 10,
    borderRadius: 8,
    width: "48%",
  },
  metricLabel: {
    color: "#aaa",
    fontSize: 12,
  },
  metricValue: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "bold",
  },
  magneticBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
  },
  magneticValue: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginLeft: 10,
  },
});
