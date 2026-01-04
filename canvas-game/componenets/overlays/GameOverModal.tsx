import React from "react";
import { View, Text, Pressable } from "react-native";

export default function GameOverModal({
  gameOverReason,
  score,
  initGame,
  styles,
}: {
  gameOverReason: string;
  score: number;
  initGame: () => void;
  styles: any;
}) {
  return (
    <View style={styles.gameOverModal}>
      <Text style={styles.gameOverTitle}>GAME OVER</Text>
      <Text style={styles.gameOverReason}>{gameOverReason}</Text>
      <Text style={styles.finalScore}>
        최종 점수: <Text style={styles.finalScoreNum}>{score}</Text>
      </Text>
      <Pressable onPress={initGame} style={({ pressed }) => [styles.retryBtn, pressed && styles.retryBtnPressed]}>
        <Text style={styles.retryBtnText}>다시 시도</Text>
      </Pressable>
    </View>
  );
}
