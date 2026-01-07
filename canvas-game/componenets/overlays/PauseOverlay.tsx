import React from "react";
import { View, Text, Pressable } from "react-native";

export default function PauseOverlay({
  onResume,
  onRestart,
  styles,
}: {
  onResume: () => void;
  onRestart: () => void;
  styles: any;
}) {
  return (
    <View style={styles.pauseOverlay}>
      <Text style={styles.pauseTitle}>PAUSED</Text>

      <Pressable
        onPress={onResume}
        style={({ pressed }) => [
          styles.pausePrimaryBtn,
          pressed && styles.pausePrimaryBtnPressed,
        ]}
      >
        <Text style={styles.pausePrimaryText}>계속하기</Text>
      </Pressable>

      <Pressable
        onPress={onRestart}
        style={({ pressed }) => [
          styles.pauseSecondaryBtn,
          pressed && styles.pauseSecondaryBtnPressed,
        ]}
      >
        <Text style={styles.pauseSecondaryText}>다시 시도</Text>
      </Pressable>
    </View>
  );
}
