import { Client } from "paho-mqtt";

export const mqttClient = new Client(
  "broker.hivemq.com",
  8884,
  "/mqtt",
  "expo_" + Math.random().toString(16).slice(2),
);
