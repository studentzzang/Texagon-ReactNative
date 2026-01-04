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
        <Text style={styles.startBtnText}>시작하기</Text>
      </Pressable>
    </View>
  );
}
