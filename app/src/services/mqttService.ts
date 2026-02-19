import mqtt from "mqtt";

const BROKER_URL = "ws://192.168.1.121:9001";
// ⚠️ TROQUE para o IP do seu PC rodando Docker

export const createMqttClient = (onMessage: any, onStatus: any) => {
  const client = mqtt.connect(BROKER_URL);

  client.on("connect", () => {
    console.log("✅ Conectado ao Mosquitto");
    onStatus("Conectado");

    client.subscribe("DSP");
    client.subscribe("sensor_temperatura_DS18B20");
  });

  client.on("error", (err) => {
    console.log("Erro MQTT:", err);
    onStatus("Erro conexão");
  });

  client.on("message", (topic, message) => {
    onMessage(topic, message.toString());
  });

  return client;
};
