import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function Card({ title, children }: any) {
  return (
    <View style={styles.card}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1a1a1a",
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
  },
  title: {
    color: "#00e5ff",
    fontWeight: "bold",
    marginBottom: 10,
  },
});
