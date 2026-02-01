import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import Svg, { Polyline, Line, Text as SvgText } from "react-native-svg";
import { Client, Message } from "paho-mqtt";

/* ================= CONFIGURAÇÕES ================= */

const { width } = Dimensions.get("window");

const CARD_WIDTH = width - 32;
const GRAPH_WIDTH = CARD_WIDTH - 60;
const GRAPH_HEIGHT = 160;

const OFFSET_X = 50;
const OFFSET_Y = 10;

const TEMP_IDEAL = 20;
const TEMP_MIN = 0;
const TEMP_MAX = 120;

/* ================= COMPONENTE ================= */

export default function Dashboard() {
  const [tempSeries, setTempSeries] = useState<number[]>([]);
  const [fftVib, setFftVib] = useState<number[]>([]);
  const [fftDes, setFftDes] = useState<number[]>([]);
  const [status, setStatus] = useState("🔴 Desconectado");

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

      if (data.temp !== undefined) {
        setTempSeries((t) => [...t.slice(-60), Number(data.temp)]);
      }

      if (Array.isArray(data.fft)) {
        if (msg.destinationName.includes("vibracao")) setFftVib(data.fft);
        if (msg.destinationName.includes("desbalanceamento"))
          setFftDes(data.fft);
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

  /* ================= EIXOS ================= */

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
      {/* eixo Y */}
      <Line
        x1={OFFSET_X}
        y1={OFFSET_Y}
        x2={OFFSET_X}
        y2={GRAPH_HEIGHT + OFFSET_Y}
        stroke="#475569"
      />

      {/* eixo X */}
      <Line
        x1={OFFSET_X}
        y1={GRAPH_HEIGHT + OFFSET_Y}
        x2={OFFSET_X + GRAPH_WIDTH}
        y2={GRAPH_HEIGHT + OFFSET_Y}
        stroke="#475569"
      />

      {/* valores eixo Y */}
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

      {/* label eixo X */}
      <SvgText
        x={OFFSET_X + GRAPH_WIDTH / 2}
        y={GRAPH_HEIGHT + OFFSET_Y + 28}
        fontSize="11"
        fill="#cbd5f5"
        textAnchor="middle"
      >
        {xLabel}
      </SvgText>

      {/* label eixo Y */}
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

  /* ================= GRÁFICO TEMPERATURA ================= */

  const TempChart = () => {
    if (tempSeries.length < 2) return null;

    const idealSeries = tempSeries.map(() => TEMP_IDEAL);

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

        {/* temperatura atual */}
        <Polyline
          points={tempSeries.map(toPoint).join(" ")}
          stroke="#22c55e"
          strokeWidth={2}
          fill="none"
        />

        {/* temperatura ideal (comparativa) */}
        <Polyline
          points={idealSeries.map(toPoint).join(" ")}
          stroke="#ef4444"
          strokeWidth={2}
          strokeDasharray="6 4"
          fill="none"
        />
      </Svg>
    );
  };

  /* ================= GRÁFICO FFT ================= */

  const FFTChart = (data: number[], color: string, yLabel: string) => {
    if (data.length < 2) return null;

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
          xLabel="Frequência (bins)"
          yLabel={yLabel}
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

      {/* TEMPERATURA */}
      <View style={styles.card}>
        <Text style={styles.label}>🌡️ Temperatura</Text>

        <View style={styles.legend}>
          <LegendItem color="#22c55e" label="Atual" />
          <LegendItem color="#ef4444" label="Ideal" />
        </View>

        <Text style={styles.value}>
          Atual: {tempSeries[tempSeries.length - 1]?.toFixed(1) ?? "--"} °C
        </Text>

        <TempChart />
      </View>

      {/* VIBRAÇÃO */}
      <View style={styles.card}>
        <Text style={styles.label}>📈 FFT Vibração</Text>
        <Text style={styles.value}>
          RMS:{" "}
          {fftVib.length
            ? Math.sqrt(
                fftVib.reduce((s, v) => s + v * v, 0) / fftVib.length,
              ).toFixed(2)
            : "--"}
        </Text>

        {FFTChart(fftVib, "#38bdf8", "Magnitude")}
      </View>

      {/* DESBALANCEAMENTO */}
      <View style={styles.card}>
        <Text style={styles.label}>⚖️ FFT Desbalanceamento</Text>
        <Text style={styles.value}>
          RMS:{" "}
          {fftDes.length
            ? Math.sqrt(
                fftDes.reduce((s, v) => s + v * v, 0) / fftDes.length,
              ).toFixed(2)
            : "--"}
        </Text>

        {FFTChart(fftDes, "#facc15", "Magnitude")}
      </View>
    </ScrollView>
  );
}

/* ================= COMPONENTES AUXILIARES ================= */

const LegendItem = ({ color, label }: { color: string; label: string }) => (
  <View style={styles.legendItem}>
    <View style={[styles.legendColor, { backgroundColor: color }]} />
    <Text style={styles.legendText}>{label}</Text>
  </View>
);

/* ================= ESTILOS ================= */

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
    fontWeight: "600",
  },
  value: {
    color: "#94a3b8",
    marginBottom: 6,
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
