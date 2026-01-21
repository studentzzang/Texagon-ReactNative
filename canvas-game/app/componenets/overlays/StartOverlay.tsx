import React from "react";
import { View, Text, Pressable } from "react-native";

export default function StartOverlay({
  startGame,
  styles,
}: {
  startGame: () => void;
  styles: any;
}) {
  return (
    <View style={styles.startOverlay}>
      <Pressable onPress={startGame} style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}>
        <Text style={styles.startBtnText}>Start</Text>

      </Pressable>

      <View style={styles.guideBox}>
          <Text style={styles.guideText}>🔢 Merge tiles to grow</Text>
          <Text style={styles.guideText}>🔥 Clear space to survive</Text>
          <Text style={styles.guideText}>🎯 No new tiles at 10</Text>
        </View>

    </View>
  );
}
