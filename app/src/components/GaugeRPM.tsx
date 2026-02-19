import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { AnimatedCircularProgress } from "react-native-circular-progress";

export default function GaugeRPM({ rpm }: any) {
  return (
    <View style={styles.container}>
      <AnimatedCircularProgress
        size={180}
        width={15}
        fill={(rpm / 3600) * 100}
        tintColor="#00e5ff"
        backgroundColor="#333"
      >
        {() => (
          <>
            <Text style={styles.rpm}>{rpm.toFixed(0)}</Text>
            <Text style={styles.label}>RPM</Text>
          </>
        )}
      </AnimatedCircularProgress>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: "center" },
  rpm: { color: "#fff", fontSize: 28, fontWeight: "bold" },
  label: { color: "#aaa" },
});
