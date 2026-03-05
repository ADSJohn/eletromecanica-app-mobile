import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Animated,
  Easing,
  Vibration,
  Alert,
  SafeAreaView,
  StatusBar,
  Platform,
} from "react-native";
import mqtt from "mqtt";
import { LineChart } from "react-native-chart-kit";
import { AnimatedCircularProgress } from "react-native-circular-progress";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { Audio } from "expo-av";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

const screenWidth = Dimensions.get("window").width;
const screenHeight = Dimensions.get("window").height;
const MQTT_URL = "ws://100.65.3.142:9001";

/* ================= REGRA ISO 10816 ================= */
const TABELA_ISO = {
  EXCELENTE: {
    limite: 2.8,
    cor: "#00e676",
    descricao: "Condição Nova/Excelente",
  },
  ACEITAVEL: { limite: 4.5, cor: "#ffb300", descricao: "Condição Aceitável" },
  ALERTA: {
    limite: 7.1,
    cor: "#ff9800",
    descricao: "Limite - Programar Manutenção",
  },
  CRITICO: {
    limite: Infinity,
    cor: "#ff1744",
    descricao: "Perigosa - Parada Imediata!",
  },
};

export default function App() {
  const [data, setData] = useState<any>(null);
  const [temperatura, setTemperatura] = useState<number>(0);
  const [severidade, setSeveridade] = useState<any>({
    nivel: "EXCELENTE",
    cor: "#00e676",
  });

  const shakeAnimation = useRef(new Animated.Value(0)).current;
  const somAlerta = useRef<Audio.Sound | null>(null);
  const ultimoAlerta = useRef<string>("");
  const somTocando = useRef<boolean>(false);

  const format = (value: number, decimals = 2) => {
    if (value === null || value === undefined || isNaN(value)) return "0";
    return Number(value).toFixed(decimals);
  };

  const calcularSeveridade = (rms: number) => {
    if (rms <= TABELA_ISO.EXCELENTE.limite) {
      return { nivel: "EXCELENTE", cor: TABELA_ISO.EXCELENTE.cor };
    } else if (rms <= TABELA_ISO.ACEITAVEL.limite) {
      return { nivel: "ACEITÁVEL", cor: TABELA_ISO.ACEITAVEL.cor };
    } else if (rms <= TABELA_ISO.ALERTA.limite) {
      return { nivel: "ALERTA", cor: TABELA_ISO.ALERTA.cor };
    } else {
      return { nivel: "CRÍTICO", cor: TABELA_ISO.CRITICO.cor };
    }
  };

  const iniciarVibracaoGauge = () => {
    Animated.sequence([
      Animated.timing(shakeAnimation, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -1,
        duration: 50,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 1,
        duration: 50,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shakeAnimation, {
        toValue: -1,
        duration: 50,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
      Animated.timing(shakeAnimation, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
        easing: Easing.linear,
      }),
    ]).start(() => {
      if (severidade.nivel === "ALERTA" || severidade.nivel === "CRÍTICO") {
        setTimeout(() => iniciarVibracaoGauge(), 500);
      }
    });
  };

  const pararVibracaoGauge = () => {
    shakeAnimation.setValue(0);
  };

  const vibrarCelular = () => {
    Vibration.vibrate([500, 200, 500, 200, 500]);
  };

  /* ========= SOM COM TRATAMENTO DE ERRO ========= */
  const tocarSomLoop = async () => {
    try {
      // Para som anterior se existir
      await pararSom();

      const { sound } = await Audio.Sound.createAsync(
        require("../../assets/alerta.mp3"),
        {
          shouldPlay: true,
          isLooping: true,
          volume: 1.0,
        },
      );

      somAlerta.current = sound;
      somTocando.current = true;

      // Listener para quando o som terminar (ou erro)
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          // Reinicia o loop se ainda deve tocar
          if (somTocando.current) {
            sound.replayAsync();
          }
        }
      });
    } catch (error) {
      console.log("Erro ao tocar som:", error);
    }
  };

  const pararSom = async () => {
    somTocando.current = false;

    if (somAlerta.current) {
      try {
        const status = await somAlerta.current.getStatusAsync();
        if (status.isLoaded) {
          await somAlerta.current.stopAsync();
          await somAlerta.current.unloadAsync();
        }
      } catch (error) {
        console.log("Erro ao parar som (já estava parado):", error);
      } finally {
        somAlerta.current = null;
      }
    }
  };

  const mostrarAlerta = (nivel: string, rms: number) => {
    if (ultimoAlerta.current === nivel) return;

    ultimoAlerta.current = nivel;

    const titulo = nivel === "CRÍTICO" ? "🔴 CONDIÇÃO CRÍTICA!" : "🟠 ATENÇÃO!";
    const mensagem =
      nivel === "CRÍTICO"
        ? `Vibração em nível CRÍTICO!\n\nRMS: ${rms.toFixed(2)} mm/s\n\n⚠️ Verifique o motor IMEDIATAMENTE!`
        : `Vibração acima do limite aceitável.\n\nRMS: ${rms.toFixed(2)} mm/s\n\n📋 Programar manutenção.`;

    // Toca som antes de mostrar alerta
    tocarSomLoop();

    Alert.alert(
      titulo,
      mensagem,
      [
        {
          text: "✅ ENTENDI - PARAR ALERTA",
          onPress: () => {
            console.log("Alerta confirmado - parando som");
            pararSom();
          },
          style: "cancel",
        },
      ],
      { cancelable: false },
    );
  };

  useEffect(() => {
    if (severidade.nivel === "ALERTA" || severidade.nivel === "CRÍTICO") {
      iniciarVibracaoGauge();
      vibrarCelular();
      mostrarAlerta(severidade.nivel, data?.time_domain?.rms ?? 0);
    } else {
      pararVibracaoGauge();
      Vibration.cancel();
      pararSom();
      ultimoAlerta.current = "";
    }
  }, [severidade.nivel]);

  useEffect(() => {
    return () => {
      pararSom();
    };
  }, []);

  useEffect(() => {
    const client = mqtt.connect(MQTT_URL);
    client.on("connect", () => {
      client.subscribe("DSP");
      client.subscribe("sensor_temperatura_DS18B20");
    });

    client.on("message", (topic, message) => {
      try {
        if (topic === "DSP") {
          const parsed = JSON.parse(message.toString());
          setData(parsed);
          const rmsAtual = parsed?.time_domain?.rms ?? 0;
          setSeveridade(calcularSeveridade(rmsAtual));
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

  /* ========= RELATÓRIO ESTILO SKF ========= */
  const gerarRelatorioSKF = async () => {
    if (!data) return;

    const rms = data?.time_domain?.rms ?? 0;
    const peak = data?.time_domain?.peak ?? 0;
    const health = data?.health_index_percent ?? 0;
    const rpm = data?.device_info?.rpm ?? 0;
    const timestamp = new Date().toLocaleString("pt-BR");

    const corSeveridade = severidade.cor;
    const nivelSeveridade = severidade.nivel;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          @page { margin: 20px; }
          body { 
            font-family: 'Segoe UI', Arial, sans-serif; 
            margin: 0; 
            padding: 20px; 
            background: #f5f5f5;
            color: #333;
          }
          .header {
            background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
            color: white;
            padding: 30px;
            border-radius: 10px;
            margin-bottom: 20px;
            text-align: center;
          }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 10px 0 0 0; opacity: 0.9; }
          .severity-box {
            background: ${corSeveridade};
            color: white;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            margin: 20px 0;
          }
          .severity-value {
            font-size: 32px;
            font-weight: bold;
            margin: 10px 0;
          }
          .grid-2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
          }
          .metric {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #007bff;
          }
          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #333;
            margin-top: 5px;
          }
          .iso-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            background: white;
            border-radius: 8px;
            overflow: hidden;
          }
          .iso-table th {
            background: #2c3e50;
            color: white;
            padding: 12px;
            text-align: left;
            font-size: 12px;
            text-transform: uppercase;
          }
          .iso-table td {
            padding: 12px;
            border-bottom: 1px solid #eee;
            font-size: 13px;
          }
          .recommendations {
            background: #fff3cd;
            border: 1px solid #ffc107;
            border-radius: 8px;
            padding: 15px;
            margin-top: 20px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #eee;
            color: #666;
            font-size: 11px;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🏭 Relatório de Análise de Vibração</h1>
          <p>PCM Industrial Monitoramento</p>
          <p style="font-size: 12px; margin-top: 15px;">Gerado em: ${timestamp}</p>
        </div>

        <div class="severity-box">
          <div style="font-size: 14px; opacity: 0.9; text-transform: uppercase;">Classificação ISO 10816</div>
          <div class="severity-value">${nivelSeveridade}</div>
          <div>RMS: ${rms.toFixed(4)} mm/s</div>
        </div>

        <div class="grid-2">
          <div class="metric">
            <div style="font-size: 12px; color: #666; text-transform: uppercase;">Índice de Saúde</div>
            <div class="metric-value" style="color: ${corSeveridade}">${health.toFixed(1)}%</div>
          </div>
          <div class="metric">
            <div style="font-size: 12px; color: #666; text-transform: uppercase;">Rotação</div>
            <div class="metric-value">${rpm} RPM</div>
          </div>
          <div class="metric">
            <div style="font-size: 12px; color: #666; text-transform: uppercase;">RMS Total</div>
            <div class="metric-value">${rms.toFixed(4)} mm/s</div>
          </div>
          <div class="metric">
            <div style="font-size: 12px; color: #666; text-transform: uppercase;">Valor de Pico</div>
            <div class="metric-value">${peak.toFixed(4)} mm/s</div>
          </div>
        </div>

        <h3 style="color: #2c3e50; margin-top: 25px;">📋 Tabela de Referência ISO 10816</h3>
        <table class="iso-table">
          <tr>
            <th>Zona</th>
            <th>Faixa (mm/s)</th>
            <th>Condição</th>
            <th>Ação Recomendada</th>
          </tr>
          <tr style="${nivelSeveridade === "EXCELENTE" ? "background: #e8f5e9;" : ""}">
            <td><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#00e676;margin-right:8px;"></span>A</td>
            <td>≤ 2.8</td>
            <td>Excelente</td>
            <td>Nenhuma ação necessária</td>
          </tr>
          <tr style="${nivelSeveridade === "ACEITÁVEL" ? "background: #fff8e1;" : ""}">
            <td><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ffb300;margin-right:8px;"></span>B</td>
            <td>2.8 - 4.5</td>
            <td>Aceitável</td>
            <td>Monitoramento rotineiro</td>
          </tr>
          <tr style="${nivelSeveridade === "ALERTA" ? "background: #ffe0b2;" : ""}">
            <td><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ff9800;margin-right:8px;"></span>C</td>
            <td>4.5 - 7.1</td>
            <td>Alerta</td>
            <td>Programar manutenção</td>
          </tr>
          <tr style="${nivelSeveridade === "CRÍTICO" ? "background: #ffcdd2;" : ""}">
            <td><span style="display:inline-block;width:12px;height:12px;border-radius:50%;background:#ff1744;margin-right:8px;"></span>D</td>
            <td>> 7.1</td>
            <td>Crítico</td>
            <td>Parada imediata para inspeção</td>
          </tr>
        </table>

        <div class="recommendations">
          <h3 style="color: #856404; margin-top: 0;">⚠️ Recomendações Técnicas</h3>
          <ul style="color: #856404;">
            ${
              nivelSeveridade === "EXCELENTE"
                ? "<li>Equipamento em condição ideal</li><li>Manter monitoramento periódico</li><li>Próxima inspeção em 30 dias</li>"
                : nivelSeveridade === "ACEITÁVEL"
                  ? "<li>Aumentar frequência de monitoramento</li><li>Verificar tendência de crescimento</li><li>Inspeção visual recomendada</li>"
                  : nivelSeveridade === "ALERTA"
                    ? "<li>Agendar manutenção preventiva</li><li>Verificar desbalanceamento/desalinhamento</li><li>Análise de espectro detalhada</li><li>Monitoramento diário obrigatório</li>"
                    : "<li>PARADA IMEDIATA DO EQUIPAMENTO</li><li>Inspeção completa de rolamentos</li><li>Verificar folgas e desgastes</li><li>Análise por especialista</li><li>Não operar até reparo</li>"
            }
          </ul>
        </div>

        <div class="footer">
          <p><strong>Relatório Técnico de Vibração</strong></p>
          <p>Sistema de Monitoramento PCM Industrial | Conformidade ISO 10816/20816</p>
        </div>
      </body>
      </html>
    `;

    try {
      const { uri } = await Print.printToFileAsync({ html });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: "Compartilhar Relatório SKF",
      });
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      Alert.alert("Erro", "Não foi possível gerar o relatório.");
    }
  };

  if (!data)
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />
        <View style={styles.center}>
          <Icon name="lan-disconnect" size={60} color="#00e5ff" />
          <Text style={{ color: "#aaa", marginTop: 15 }}>
            Aguardando dados MQTT...
          </Text>
        </View>
      </SafeAreaView>
    );

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

  const healthColor = severidade.cor;
  const healthLevelText = severidade.nivel;
  const rmsColor = severidade.cor;
  const tempColor =
    temperatura < 50 ? "#00e676" : temperatura < 70 ? "#ffb300" : "#ff1744";

  const shakeTranslate = shakeAnimation.interpolate({
    inputRange: [-1, 1],
    outputRange: [-8, 8],
  });

  const chartConfig = {
    backgroundGradientFrom: "#111",
    backgroundGradientTo: "#111",
    decimalPlaces: 4,
    color: () => "#00e5ff",
    labelColor: () => "#aaa",
    propsForBackgroundLines: { strokeWidth: 0 },
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#0d0d0d" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>🏭 PAINEL INDUSTRIAL PCM</Text>

        <View style={styles.row}>
          <Animated.View
            style={[
              styles.gaugeBox,
              { transform: [{ translateX: shakeTranslate }] },
            ]}
          >
            <AnimatedCircularProgress
              size={130}
              width={12}
              fill={health}
              tintColor={healthColor}
              backgroundColor="#333"
            >
              {() => (
                <View style={{ alignItems: "center" }}>
                  <Icon name="heart-pulse" size={24} color={healthColor} />
                  <Text style={[styles.gaugeValue, { color: healthColor }]}>
                    {format(health, 0)}%
                  </Text>
                  <Text style={[styles.gaugeLevel, { color: healthColor }]}>
                    {healthLevelText}
                  </Text>
                  <Text style={styles.gaugeLabel}>Saúde Motor</Text>
                </View>
              )}
            </AnimatedCircularProgress>
          </Animated.View>

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
                  <Icon name="thermometer" size={24} color={tempColor} />
                  <Text style={[styles.gaugeValue, { color: tempColor }]}>
                    {format(temperatura, 1)}°C
                  </Text>
                  <Text style={styles.gaugeLabel}>Temperatura</Text>
                </View>
              )}
            </AnimatedCircularProgress>
          </View>
        </View>

        <Card title="📈 Vibração">
          <View style={styles.metricRow}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Icon name="waveform" size={18} color="#00e5ff" />
              <Text style={styles.metricLabel}>RMS</Text>
            </View>
            <Text style={[styles.metricValue, { color: rmsColor }]}>
              {format(rms, 4)}
            </Text>
          </View>
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
              width={screenWidth - 50}
              height={220}
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

        <TouchableOpacity style={styles.pdfButton} onPress={gerarRelatorioSKF}>
          <Icon name="file-pdf-box" size={20} color="#fff" />
          <Text style={styles.pdfText}>Gerar Relatório SKF</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

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

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0d0d0d",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  scrollView: { flex: 1 },
  contentContainer: {
    paddingHorizontal: 15,
    paddingTop: 10,
  },
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
    marginBottom: 15,
    marginTop: 5,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  gaugeBox: {
    width: "48%",
    alignItems: "center",
  },
  gaugeValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  gaugeLevel: {
    fontSize: 10,
    fontWeight: "bold",
    marginTop: 2,
    textTransform: "uppercase",
  },
  gaugeLabel: {
    color: "#aaa",
    fontSize: 11,
    marginTop: 2,
  },
  card: {
    backgroundColor: "#1a1a1a",
    padding: 14,
    borderRadius: 12,
    marginBottom: 15,
  },
  cardTitle: {
    color: "#fff",
    marginBottom: 8,
    fontWeight: "600",
    fontSize: 14,
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  metricLabel: {
    color: "#aaa",
    marginLeft: 6,
    fontSize: 13,
  },
  metricValue: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 13,
  },
  axisLabel: {
    color: "#888",
    fontSize: 10,
    marginBottom: 6,
  },
  pdfButton: {
    flexDirection: "row",
    backgroundColor: "#007bff",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 25,
    alignSelf: "center",
    marginVertical: 20,
    alignItems: "center",
    shadowColor: "#007bff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  pdfText: {
    color: "#fff",
    marginLeft: 8,
    fontWeight: "bold",
    fontSize: 14,
  },
  bottomSpace: { height: 30 },
});
