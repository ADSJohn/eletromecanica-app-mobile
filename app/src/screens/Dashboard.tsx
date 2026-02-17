import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import mqtt from "mqtt";
import { LineChart, BarChart } from "react-native-chart-kit";
import Svg, { Path } from "react-native-svg";

const screenWidth = Dimensions.get("window").width;

export default function App() {
  const [data, setData] = useState(null);
  const [healthHistory, setHealthHistory] = useState([]);
  const [tooltip, setTooltip] = useState({ visible: false, text: "" });

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
    });

    client.on("message", (topic, message) => {
      const json = JSON.parse(message.toString());
      setData(json);
      setHealthHistory((prev) => [
        ...prev.slice(-20),
        json.health_index_percent,
      ]);
    });

    return () => client.end();
  }, []);

  if (!data) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#fff" }}>Aguardando dados da DSP...</Text>
      </View>
    );
  }

  const health = data.health_index_percent;

  const statusColor =
    health > 80
      ? "#00c853"
      : health > 60
        ? "#ffb300"
        : health > 40
          ? "#ff6d00"
          : "#d50000";

  const chartConfig = {
    backgroundGradientFrom: "#1e1e1e",
    backgroundGradientTo: "#1e1e1e",
    decimalPlaces: 2,
    color: () => "#ff9800",
    labelColor: () => "#fff",
  };

  const showInfo = (text) => {
    setTooltip({ visible: true, text });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>MONITORAMENTO DE SAÚDE DO MOTOR</Text>

      {/* STATUS GERAL */}
      <View style={styles.card}>
        <SectionTitle
          title="Status Geral"
          info="Mostra o índice global de saúde do motor baseado em vibração e falhas detectadas."
          onPress={showInfo}
        />

        <View style={styles.gaugeWrapper}>
          <Gauge percentage={health} color={statusColor} />
          <Text style={styles.healthText}>{health}%</Text>
        </View>

        <View style={styles.row}>
          <Metric
            label="RMS (g)"
            value={`${data.time_domain.rms}`}
            info="RMS representa a energia total da vibração. Valores altos indicam possível desgaste."
            onPress={showInfo}
          />
          <Metric
            label="Frequência Dominante (Hz)"
            value={`${data.frequency_domain.dominant_frequency_hz}`}
            info="Frequência com maior amplitude detectada na FFT."
            onPress={showInfo}
          />
        </View>

        <Text style={[styles.statusText, { color: statusColor }]}>
          {data.overall_condition.toUpperCase()}
        </Text>
      </View>

      {/* DOMÍNIO DO TEMPO */}
      <View style={styles.card}>
        <SectionTitle
          title="Análise no Domínio do Tempo"
          info="Mostra os valores RMS e Pico da vibração."
          onPress={showInfo}
        />

        <LineChart
          data={{
            labels: ["RMS", "Pico"],
            datasets: [
              {
                data: [data.time_domain.rms, data.time_domain.peak],
              },
            ],
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
        />
      </View>

      {/* FALHAS DE ROLAMENTO */}
      <View style={styles.card}>
        <SectionTitle
          title="Análise de Falhas de Rolamento"
          info="BPFO e BPFI indicam falhas na pista externa e interna do rolamento."
          onPress={showInfo}
        />

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
          height={220}
          chartConfig={chartConfig}
        />
      </View>

      {/* TENDÊNCIA SAÚDE */}
      <View style={styles.card}>
        <SectionTitle
          title="Tendência do Índice de Saúde"
          info="Mostra a evolução da saúde do motor ao longo do tempo."
          onPress={showInfo}
        />

        <LineChart
          data={{
            labels: healthHistory.map((_, i) => i.toString()),
            datasets: [{ data: healthHistory }],
          }}
          width={screenWidth - 40}
          height={220}
          chartConfig={chartConfig}
        />
      </View>

      {/* ANÁLISE MAGNÉTICA */}
      <View style={styles.card}>
        <SectionTitle
          title="Análise Magnética"
          info="Desvio padrão do heading. Valores altos indicam desalinhamento ou instabilidade."
          onPress={showInfo}
        />
        <Text style={{ color: "#fff", fontSize: 18 }}>
          Desvio do Heading: {data.magnetic_analysis.heading_std_deviation}
        </Text>
      </View>

      {/* TOOLTIP MODAL */}
      <Modal transparent visible={tooltip.visible} animationType="fade">
        <TouchableOpacity
          style={styles.modalBackground}
          onPress={() => setTooltip({ visible: false, text: "" })}
        >
          <View style={styles.tooltipBox}>
            <Text style={{ color: "#fff" }}>{tooltip.text}</Text>
          </View>
        </TouchableOpacity>
      </Modal>
    </ScrollView>
  );
}

/* COMPONENTES AUXILIARES */

const SectionTitle = ({ title, info, onPress }) => (
  <View style={{ flexDirection: "row", alignItems: "center" }}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <TouchableOpacity onPress={() => onPress(info)}>
      <Text style={styles.infoIcon}> ℹ️</Text>
    </TouchableOpacity>
  </View>
);

const Metric = ({ label, value, info, onPress }) => (
  <View style={styles.metricBox}>
    <View style={{ flexDirection: "row" }}>
      <Text style={styles.metricLabel}>{label}</Text>
      <TouchableOpacity onPress={() => onPress(info)}>
        <Text style={styles.infoIcon}> ℹ️</Text>
      </TouchableOpacity>
    </View>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

const Gauge = ({ percentage, color }) => {
  const angle = (percentage / 100) * 180;

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
    <Svg width={200} height={120}>
      <Path
        d={describeArc(100, 100, 80, 0, 180)}
        stroke="#333"
        strokeWidth="20"
        fill="none"
      />
      <Path
        d={describeArc(100, 100, 80, 0, angle)}
        stroke={color}
        strokeWidth="20"
        fill="none"
      />
    </Svg>
  );
};

/* ESTILOS */

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
  },
  header: {
    fontSize: 22,
    color: "#fff",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  card: {
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
  },
  sectionTitle: {
    color: "#fff",
    fontSize: 16,
    marginBottom: 10,
    fontWeight: "600",
  },
  infoIcon: {
    color: "#ff9800",
    fontSize: 14,
  },
  gaugeWrapper: {
    alignItems: "center",
    justifyContent: "center",
  },
  healthText: {
    position: "absolute",
    top: 45,
    fontSize: 22,
    color: "#fff",
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
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
    fontSize: 16,
    fontWeight: "bold",
  },
  statusText: {
    marginTop: 10,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  tooltipBox: {
    backgroundColor: "#2b2e34",
    padding: 20,
    borderRadius: 10,
    width: "80%",
  },
});
