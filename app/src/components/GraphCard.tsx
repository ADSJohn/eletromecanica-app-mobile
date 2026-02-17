import React from "react";
import { View, Text, StyleSheet, Dimensions } from "react-native";
import Svg, { Polyline, Line, Text as SvgText } from "react-native-svg";
import { classifyISO } from "../utils/iso10816";
import StatusLed from "../components/StatusLed";

const { width } = Dimensions.get("window");

export default function GraphCard({ title, data, max, rpm }: any) {
  const height = 160;
  const paddingLeft = 42;
  const paddingBottom = 28;

  if (!data || data.length < 2) return null;

  const rms = Math.sqrt(
    data.reduce((s: number, v: number) => s + v * v, 0) / data.length,
  );

  const iso = classifyISO(rms);

  const points = data
    .map((v: number, i: number) => {
      const x =
        paddingLeft + (i / (data.length - 1)) * (width - 64 - paddingLeft);
      const y = height - paddingBottom - (v / max) * (height - 40);
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <StatusLed color={iso.color} />
      </View>

      <Svg width={width - 64} height={height}>
        <Line
          x1={paddingLeft}
          y1={10}
          x2={paddingLeft}
          y2={height - paddingBottom}
          stroke="#475569"
        />
        <Line
          x1={paddingLeft}
          y1={height - paddingBottom}
          x2={width - 64}
          y2={height - paddingBottom}
          stroke="#475569"
        />

        <Polyline
          points={points}
          stroke={iso.color}
          strokeWidth={2.5}
          fill="none"
        />

        <SvgText
          x={width / 2 - 32}
          y={height - 6}
          fontSize="10"
          fill="#94a3b8"
          textAnchor="middle"
        >
          Frequência (Hz)
        </SvgText>

        <SvgText
          x={12}
          y={height / 2}
          fontSize="10"
          fill="#94a3b8"
          rotation="-90"
          origin={`12,${height / 2}`}
        >
          Amplitude
        </SvgText>
      </Svg>

      <Text style={{ color: iso.color, fontSize: 12 }}>
        ISO 10816 – Zona {iso.zone} ({iso.description})
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: "#0f172a",
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
    borderColor: "#1e293b",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  title: {
    color: "#e5e7eb",
    fontWeight: "600",
  },
});
