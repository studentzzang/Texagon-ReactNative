import React from "react";
import { View, Text, Pressable } from "react-native";

export default function StartOverlay({
  startGame,
  highScore,
  styles,
}: {
  startGame: () => void;
  highScore: number;
  styles: any;
}) {
  return (
    <View style={styles.startOverlay}>
      {/* 시작 버튼 */}
      <Pressable
        onPress={startGame}
        style={({ pressed }) => [
          styles.startBtn,
          pressed && styles.startBtnPressed,
        ]}
      >
        <Text style={styles.startBtnText}>시작하기</Text>
      </Pressable>

      <Text
        style={{
          marginTop: 20,       
          fontSize: 14,
          fontWeight: "700",
          color: "#64748b",
          fontFamily: "Pretendard",
        }}
      >
        최고 점수 {highScore.toLocaleString()}
      </Text>
    </View>
  );
}
