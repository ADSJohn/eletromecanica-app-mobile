import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import mqtt from 'mqtt';

export default function HomeScreen() {
  const [temperatura, setTemperatura] = useState('--');
  const [status, setStatus] = useState('Conectando...');

  useEffect(() => {
    const client = mqtt.connect('ws://192.168.1.110:9001', {
      clientId: 'rn-client-' + Math.random().toString(16).substr(2, 8),
      clean: true,
      reconnectPeriod: 3000,
      connectTimeout: 4000,
    });

    client.on('connect', () => {
      setStatus('🟢 Conectado ao Mosquitto');
      client.subscribe('temperatura/topic');
    });

    client.on('message', (topic, message) => {
      setTemperatura(message.toString());
    });

    client.on('error', err => {
      setStatus('🔴 Erro de conexão');
      console.log('MQTT error:', err);
      client.end();
    });

    return () => {
      client.end(true);
    };
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.status}>{status}</Text>

      <Text style={styles.title}>🌡 Temperatura</Text>
      <Text style={styles.value}>{temperatura}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
  },
  status: {
    color: '#38bdf8',
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    color: '#e5e7eb',
  },
  value: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#22c55e',
  },
});
