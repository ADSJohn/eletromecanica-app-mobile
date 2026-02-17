import mqtt from "mqtt";
import config from "../config/mqttConfing";

let client;

export const connectMQTT = (onMessage) => {
  client = mqtt.connect(config.broker, {
    username: config.username,
    password: config.password,
    reconnectPeriod: 5000,
  });

  client.on("connect", () => {
    console.log("Conectado ao HiveMQ");
    client.subscribe(config.topic);
  });

  client.on("message", (topic, message) => {
    try {
      const parsed = JSON.parse(message.toString());
      onMessage(parsed);
    } catch (e) {
      console.log("Erro JSON:", e);
    }
  });
};
