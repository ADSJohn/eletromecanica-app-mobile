import React from "react";
import { View, Text } from "react-native";

export default function BearingBars({ bpfo, bpfi }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
      <View>
        <Text style={{ color: "#FFC107" }}>BPFO</Text>
        <Text style={{ color: "#fff", fontSize: 18 }}>{bpfo} g</Text>
      </View>
      <View>
        <Text style={{ color: "#F44336" }}>BPFI</Text>
        <Text style={{ color: "#fff", fontSize: 18 }}>{bpfi} g</Text>
      </View>
    </View>
  );
}
