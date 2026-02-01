import { Client, Message } from "paho-mqtt";

const BROKER = "broker.hivemq.com";
const PORT = 8884;
const PATH = "/mqtt";

export function createMQTTClient(
  onMessage: (data: any) => void,
  onStatus: (s: string) => void,
) {
  const clientId = "expo_" + Math.random().toString(16).slice(2);
  const client = new Client(BROKER, PORT, PATH, clientId);

  client.onConnectionLost = () => {
    onStatus("🔴 MQTT desconectado");
  };

  client.onMessageArrived = (message: Message) => {
    try {
      const json = JSON.parse(message.payloadString);
      onMessage(json);
    } catch {
      console.warn("⚠️ JSON inválido recebido");
    }
  };

  client.connect({
    useSSL: true,
    timeout: 5,
    onSuccess: () => {
      onStatus("🟢 MQTT conectado");
      client.subscribe("eletromecanica/motor/fft");
      client.subscribe("eletromecanica/motor/sensores");
    },
    onFailure: () => {
      onStatus("🔴 Falha MQTT");
    },
  });

  return client;
}
