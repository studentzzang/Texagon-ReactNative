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
        style={[styles.finalScore , {paddingTop: "4%"}]}
      >
        최고 점수 <Text style={styles.scoreOrange}>{highScore.toLocaleString()}</Text> 
      </Text>
    </View>
  );
}
