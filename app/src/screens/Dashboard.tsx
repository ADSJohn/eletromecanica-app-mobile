import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Dimensions,
  Alert,
  Platform,
  StyleSheet,
} from "react-native";
import Svg, { Polyline, Line, Text as SvgText, Rect } from "react-native-svg";
import ViewShot from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import * as FileSystem from "expo-file-system/legacy";
import { Buffer } from "buffer";

/* ================= CONFIG ================= */
const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 32;
const GRAPH_WIDTH = CARD_WIDTH - 60;
const GRAPH_HEIGHT = 160;
const OFFSET_X = 50;
const OFFSET_Y = 10;

const TEMP_IDEAL = 60;
const TEMP_MIN = 0;
const TEMP_MAX = 120;
const TEMP_CRITICA = 85;

/* ================= UTIL: DETECT PICS ================= */
function findPeaks(data: number[]) {
  const peaks: { index: number; value: number }[] = [];
  for (let i = 1; i < data.length - 1; i++) {
    if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
      peaks.push({ index: i, value: data[i] });
    }
  }
  return peaks;
}

/* ================= COMPONENT ================= */
export default function Dashboard() {
  const [tempSeries, setTempSeries] = useState<number[]>([]);
  const [fftVib, setFftVib] = useState<number[]>([]);
  const [fftDes, setFftDes] = useState<number[]>([]);
  const [alerta, setAlerta] = useState<string | null>(null);
  const [alarmeAtivo, setAlarmeAtivo] = useState(false);

  const tempChartRef = useRef<any>(null);
  const fftVibRef = useRef<any>(null);
  const fftDesRef = useRef<any>(null);

  /* ================= SIMULAÇÃO DE DADOS ================= */
  useEffect(() => {
    const interval = setInterval(() => {
      const temp = Math.floor(Math.random() * 100);
      const fft1 = Array.from({ length: 50 }, () => Math.random() * 100);
      const fft2 = Array.from({ length: 50 }, () => Math.random() * 100);

      setTempSeries((prev) => [...prev.slice(-59), temp]);
      setFftVib(fft1);
      setFftDes(fft2);

      if (temp > TEMP_CRITICA && !alarmeAtivo) {
        setAlerta(`Temperatura crítica: ${temp}°C`);
        setAlarmeAtivo(true);
      } else if (temp <= TEMP_CRITICA) {
        setAlarmeAtivo(false);
        setAlerta(null);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [alarmeAtivo]);

  /* ================= PDF ================= */
  const generatePDF = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage();
      const { height } = page.getSize();
      let y = height - 50;

      const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const normalFont = await pdfDoc.embedFont(StandardFonts.Helvetica);

      page.drawText("Relatório PCM - Leituras e Falhas", {
        x: 50,
        y,
        size: 18,
        font: titleFont,
        color: rgb(0, 0, 0),
      });
      y -= 30;

      const captureChart = async (ref: any) => {
        if (!ref.current) return null;
        const uri = await ref.current.capture();
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        return base64;
      };

      const charts = [
        { ref: tempChartRef, label: "Temperatura" },
        { ref: fftVibRef, label: "FFT Vibração" },
        { ref: fftDesRef, label: "FFT Desbalanceamento" },
      ];

      for (const c of charts) {
        const base64 = await captureChart(c.ref);
        if (base64) {
          const img = await pdfDoc.embedPng(base64);
          page.drawImage(img, { x: 50, y: y - 150, width: 400, height: 150 });
          y -= 170;
        }
      }

      if (alerta) {
        page.drawText("Alertas / Falhas:", {
          x: 50,
          y,
          size: 12,
          font: titleFont,
          color: rgb(1, 0, 0),
        });
        y -= 20;
        page.drawText(alerta, { x: 60, y, size: 10, font: normalFont });
      }

      const pdfBytes = await pdfDoc.save();
      const base64PDF = Buffer.from(pdfBytes).toString("base64");

      const filePath = `${FileSystem.documentDirectory}relatorio_pcm_${Date.now()}.pdf`;
      await FileSystem.writeAsStringAsync(filePath, base64PDF, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (Platform.OS === "web") {
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        window.open(url);
      } else {
        await Sharing.shareAsync(filePath, { mimeType: "application/pdf" });
      }

      Alert.alert("Sucesso", "PDF gerado com sucesso!");
    } catch (err) {
      console.error(err);
      Alert.alert("Erro", "Falha ao gerar PDF");
    }
  };

  /* ================= AXES & CHARTS ================= */
  const Axes = ({ yLabels, xLabel, yLabel }: any) => (
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
      {yLabels.map((l: string, i: number) => {
        const y =
          OFFSET_Y + GRAPH_HEIGHT - (i / (yLabels.length - 1)) * GRAPH_HEIGHT;
        return (
          <SvgText
            key={l}
            x={OFFSET_X - 6}
            y={y + 4}
            fontSize={10}
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
        fontSize={11}
        fill="#cbd5f5"
        textAnchor="middle"
      >
        {xLabel}
      </SvgText>
      <SvgText
        x={12}
        y={OFFSET_Y + GRAPH_HEIGHT / 2}
        fontSize={11}
        fill="#cbd5f5"
        transform={`rotate(-90 12 ${OFFSET_Y + GRAPH_HEIGHT / 2})`}
        textAnchor="middle"
      >
        {yLabel}
      </SvgText>
    </>
  );

  const Legend = ({ items }: { items: { color: string; label: string }[] }) => (
    <Svg height={20} width={CARD_WIDTH} style={{ marginBottom: 6 }}>
      {items.map((item, idx) => (
        <React.Fragment key={idx}>
          <Rect
            x={10 + idx * 120}
            y={4}
            width={12}
            height={12}
            fill={item.color}
          />
          <SvgText x={25 + idx * 120} y={15} fontSize={10} fill="#fff">
            {item.label}
          </SvgText>
        </React.Fragment>
      ))}
    </Svg>
  );

  const TempChart = () => {
    if (tempSeries.length < 2) return null;
    const ideal = tempSeries.map(() => TEMP_IDEAL);
    const toPoint = (v: number, i: number) => {
      const x = OFFSET_X + (i / (tempSeries.length - 1)) * GRAPH_WIDTH;
      const y =
        OFFSET_Y +
        GRAPH_HEIGHT -
        ((v - TEMP_MIN) / (TEMP_MAX - TEMP_MIN)) * GRAPH_HEIGHT;
      return { x, y, v };
    };
    const points = tempSeries.map(toPoint);
    const idealPoints = ideal.map(toPoint);
    const peaks = findPeaks(tempSeries);

    return (
      <View>
        <Legend
          items={[
            { color: "#22c55e", label: "Temperatura atual" },
            { color: "#ef4444", label: "Temperatura ideal" },
          ]}
        />
        <Svg width={CARD_WIDTH} height={GRAPH_HEIGHT + 60}>
          <Axes
            yLabels={["0", "30", "60", "90", "120"]}
            xLabel="Tempo"
            yLabel="°C"
          />
          <Polyline
            points={points.map((p) => `${p.x},${p.y}`).join(" ")}
            stroke="#22c55e"
            strokeWidth={2}
            fill="none"
          />
          <Polyline
            points={idealPoints.map((p) => `${p.x},${p.y}`).join(" ")}
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="6 4"
            fill="none"
          />
          {peaks.map((p) => {
            const pt = points[p.index];
            return (
              <SvgText
                key={p.index}
                x={pt.x}
                y={pt.y - 5}
                fontSize={10}
                fill="#22c55e"
                textAnchor="middle"
              >
                {pt.v}°C
              </SvgText>
            );
          })}
        </Svg>
      </View>
    );
  };

  const FFTChart = (data: number[], color: string, label: string) => {
    if (!data || data.length < 2) return null;
    const toPoint = (v: number, i: number) => {
      const x = OFFSET_X + (i / (data.length - 1)) * GRAPH_WIDTH;
      const y =
        OFFSET_Y + GRAPH_HEIGHT - (v / Math.max(...data)) * GRAPH_HEIGHT;
      return { x, y, v };
    };
    const points = data.map(toPoint);
    const peaks = findPeaks(data);

    return (
      <View>
        <Legend items={[{ color, label }]} />
        <Svg width={CARD_WIDTH} height={GRAPH_HEIGHT + 60}>
          <Axes
            yLabels={["0", "25%", "50%", "75%", "100%"]}
            xLabel="Frequência"
            yLabel={label}
          />
          <Polyline
            points={points.map((p) => `${p.x},${p.y}`).join(" ")}
            stroke={color}
            strokeWidth={2}
            fill="none"
          />
          {peaks.map((p) => {
            const pt = points[p.index];
            return (
              <SvgText
                key={p.index}
                x={pt.x}
                y={pt.y - 5}
                fontSize={10}
                fill={color}
                textAnchor="middle"
              >
                {pt.v.toFixed(1)}
              </SvgText>
            );
          })}
        </Svg>
      </View>
    );
  };

  /* ================= JSX ================= */
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Monitoramento do Motor</Text>

      {alerta && (
        <View style={styles.alertBox}>
          <Text style={styles.alertTitle}>ALERTA CRÍTICO</Text>
          <Text style={styles.alertMsg}>{alerta}</Text>
          <Pressable
            style={styles.alertBtn}
            onPress={() => {
              setAlarmeAtivo(false);
              setAlerta(null);
            }}
          >
            <Text style={styles.alertBtnText}>PARAR ALERTA</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.label}>Temperatura</Text>
        <ViewShot ref={tempChartRef} options={{ format: "png", quality: 1.0 }}>
          <TempChart />
        </ViewShot>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>FFT Vibração</Text>
        <ViewShot ref={fftVibRef} options={{ format: "png", quality: 1.0 }}>
          {FFTChart(fftVib, "#38bdf8", "Magnitude")}
        </ViewShot>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>FFT Desbalanceamento</Text>
        <ViewShot ref={fftDesRef} options={{ format: "png", quality: 1.0 }}>
          {FFTChart(fftDes, "#facc15", "Magnitude")}
        </ViewShot>
      </View>

      <Pressable
        style={[styles.alertBtn, { marginBottom: 30 }]}
        onPress={generatePDF}
      >
        <Text style={styles.alertBtnText}>Gerar Relatório PDF</Text>
      </Pressable>
    </ScrollView>
  );
}

/* ================= STYLES ================= */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#020617", padding: 16 },
  title: { color: "#fff", fontSize: 22, fontWeight: "bold", marginBottom: 16 },
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
