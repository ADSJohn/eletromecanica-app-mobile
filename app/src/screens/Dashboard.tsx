import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from "react-native";
import mqtt from "mqtt";
import { LineChart } from "react-native-chart-kit";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const screenWidth = Dimensions.get("window").width;
const MQTT_URL = "ws://192.168.1.121:9001";

export default function App() {
  const [data, setData] = useState<any>(null);
  const [temperatura, setTemperatura] = useState<number>(0);

  /* ========= FORMATADOR GLOBAL ========= */
  const format = (value: number, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) return "0";
    return Number(value).toFixed(decimals);
  };

  useEffect(() => {
    const client = mqtt.connect(MQTT_URL);

    client.on("connect", () => {
      client.subscribe("DSP");
      client.subscribe("sensor_temperatura_DS18B20");
    });

    client.on("message", (topic, message) => {
      try {
        if (topic === "DSP") {
          setData(JSON.parse(message.toString()));
        }

        if (topic === "sensor_temperatura_DS18B20") {
          const temp = JSON.parse(message.toString());
          setTemperatura(temp?.temperatura ?? 0);
        }
      } catch (err) {
        console.log("Erro MQTT:", err);
      }
    });

    return () => client.end();
  }, []);

  if (!data)
    return (
      <View style={styles.center}>
        <Icon name="lan-disconnect" size={60} color="#00e5ff" />
        <Text style={{ color: "#aaa", marginTop: 15 }}>
          Aguardando dados MQTT...
        </Text>
      </View>
    );

  /* ========= EXTRAÇÃO ========= */

  const rpm = data?.device_info?.rpm ?? 0;
  const rms = data?.time_domain?.rms ?? 0;
  const peak = data?.time_domain?.peak ?? 0;
  const dominantFreq = data?.frequency_domain?.dominant_frequency_hz ?? 0;
  const health = data?.health_index_percent ?? 0;
  const headingStd = data?.magnetic_analysis?.heading_std_deviation ?? 0;

  const amp1x = data?.shaft_orders?.["1x_RPM"] ?? 0;
  const amp2x = data?.shaft_orders?.["2x_RPM"] ?? 0;
  const amp3x = data?.shaft_orders?.["3x_RPM"] ?? 0;

  const bpfo = data?.bearing_fault_frequencies?.BPFO ?? 0;
  const bpfi = data?.bearing_fault_frequencies?.BPFI ?? 0;

  const freqs = data?.spectrum?.frequencies_hz ?? [];
  const amps = data?.spectrum?.amplitudes ?? [];

  /* ========= CORES ========= */

  const healthColor =
    health > 80 ? "#00e676" : health > 60 ? "#ffb300" : "#ff1744";

  const tempColor =
    temperatura < 50 ? "#00e676" : temperatura < 70 ? "#ffb300" : "#ff1744";

  /* ========= RELATÓRIO ========= */

  const gerarRelatorio = async () => {
    const html = `
      <h1>Relatório Motor</h1>
      <p>RPM: ${format(rpm, 0)}</p>
      <p>Temperatura: ${format(temperatura, 1)} °C</p>
      <p>RMS: ${format(rms, 4)}</p>
      <p>Pico: ${format(peak, 4)}</p>
      <p>Saúde: ${format(health, 0)} %</p>
      <p>1xRPM: ${format(amp1x, 3)}</p>
      <p>2xRPM: ${format(amp2x, 3)}</p>
      <p>3xRPM: ${format(amp3x, 3)}</p>
      <p>BPFO: ${format(bpfo, 2)}</p>
      <p>BPFI: ${format(bpfi, 2)}</p>
    `;

    const { uri } = await Print.printToFileAsync({ html });
    await Sharing.shareAsync(uri);
  };

  const chartConfig = {
    backgroundGradientFrom: "#111",
    backgroundGradientTo: "#111",
    decimalPlaces: 4,
    color: () => "#00e5ff",
    labelColor: () => "#aaa",
    propsForBackgroundLines: {
      strokeWidth: 0,
    },
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🏭 PAINEL INDUSTRIAL PCM</Text>

      {/* ========= GAUGES ========= */}
      <View style={styles.row}>
        <View style={styles.gaugeBox}>
          <AnimatedCircularProgress
            size={130}
            width={12}
            fill={health}
            tintColor={healthColor}
            backgroundColor="#333"
          >
            {() => (
              <View style={{ alignItems: "center" }}>
                <Icon name="heart-pulse" size={26} color={healthColor} />
                <Text style={styles.gaugeValue}>{format(health, 0)}%</Text>
                <Text style={styles.gaugeLabel}>Saúde</Text>
              </View>
            )}
          </AnimatedCircularProgress>
        </View>

        <View style={styles.gaugeBox}>
          <AnimatedCircularProgress
            size={130}
            width={12}
            fill={temperatura}
            tintColor={tempColor}
            backgroundColor="#333"
          >
            {() => (
              <View style={{ alignItems: "center" }}>
                <Icon name="thermometer" size={26} color={tempColor} />
                <Text style={styles.gaugeValue}>
                  {format(temperatura, 1)}°C
                </Text>
                <Text style={styles.gaugeLabel}>Temperatura</Text>
              </View>
            )}
          </AnimatedCircularProgress>
        </View>
      </View>

      {/* ========= MÉTRICAS ========= */}
      <Card title="📈 Vibração">
        <Metric icon="waveform" label="RMS" value={format(rms, 4)} />
        <Metric icon="arrow-up-bold" label="Pico" value={format(peak, 4)} />
      </Card>

      <Card title="📡 Frequência">
        <Metric
          icon="chart-line"
          label="Freq Dominante"
          value={`${format(dominantFreq, 1)} Hz`}
        />
        <Metric
          icon="compass"
          label="Desvio Magnético"
          value={format(headingStd, 2)}
        />
      </Card>

      <Card title="⚙ Harmônicas">
        <Metric
          icon="numeric-1-circle"
          label="1x RPM"
          value={format(amp1x, 3)}
        />
        <Metric
          icon="numeric-2-circle"
          label="2x RPM"
          value={format(amp2x, 3)}
        />
        <Metric
          icon="numeric-3-circle"
          label="3x RPM"
          value={format(amp3x, 3)}
        />
      </Card>

      <Card title="🔎 Rolamentos">
        <Metric icon="alpha-b-circle" label="BPFO" value={format(bpfo, 2)} />
        <Metric
          icon="alpha-b-circle-outline"
          label="BPFI"
          value={format(bpfi, 2)}
        />
      </Card>

      {/* ========= FFT ========= */}
      <Card title="📊 Spectrum FFT">
        <Text style={styles.axisLabel}>
          Eixo X → Frequência (Hz) | Eixo Y → Amplitude
        </Text>

        {amps.length > 0 && (
          <LineChart
            data={{
              labels: freqs
                .filter((_, i) => i % 8 === 0)
                .map((f: number) => format(f, 0)),
              datasets: [{ data: amps }],
            }}
            width={screenWidth - 40}
            height={250}
            chartConfig={chartConfig}
            withDots={false}
            withInnerLines={false}
            withOuterLines={false}
            withVerticalLines={false}
            withHorizontalLines={false}
            bezier
          />
        )}
      </Card>

      {/* ========= BOTÃO ========= */}
      <TouchableOpacity style={styles.pdfButton} onPress={gerarRelatorio}>
        <Icon name="file-pdf-box" size={18} color="#fff" />
        <Text style={styles.pdfText}>Relatório</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

/* ========= COMPONENTES ========= */

const Card = ({ title, children }: any) => (
  <View style={styles.card}>
    <Text style={styles.cardTitle}>{title}</Text>
    {children}
  </View>
);

const Metric = ({ icon, label, value }: any) => (
  <View style={styles.metricRow}>
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Icon name={icon} size={18} color="#00e5ff" />
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
    <Text style={styles.metricValue}>{value}</Text>
  </View>
);

/* ========= ESTILOS ========= */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d0d", padding: 15 },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0d0d0d",
  },
  title: {
    color: "#00e5ff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  gaugeBox: { width: "48%", alignItems: "center" },
  gaugeValue: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  gaugeLabel: { color: "#aaa", fontSize: 12 },
  card: {
    backgroundColor: "#1a1a1a",
    padding: 16,
    borderRadius: 14,
    marginBottom: 18,
  },
  cardTitle: { color: "#fff", marginBottom: 10, fontWeight: "600" },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  metricLabel: { color: "#aaa", marginLeft: 6 },
  metricValue: { color: "#fff", fontWeight: "bold" },
  axisLabel: { color: "#888", fontSize: 11, marginBottom: 8 },
  pdfButton: {
    flexDirection: "row",
    backgroundColor: "#ff1744",
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
    alignSelf: "center",
    marginBottom: 40,
  },
  pdfText: { color: "#fff", marginLeft: 6, fontWeight: "bold" },
});
