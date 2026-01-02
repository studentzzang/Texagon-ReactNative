import React from "react";
import { View, Text } from "react-native";

export default function ScoreBoard({
  level,
  score,
  spawnSpeedText,
  spawnProgress,
  sum,
  message,
  msgColorStyle,
  styles,
}: {
  level: number;
  score: number;
  spawnSpeedText: string;
  spawnProgress: number;
  sum: number;
  message: string;
  msgColorStyle: any;
  styles: any;
}) {
  return (
    <View style={styles.scoreBoard}>
      <View style={styles.topRow}>
        <Text style={styles.topRowText}>
          Lv.<Text style={styles.topRowText}>{level}</Text>
        </Text>
        <Text style={styles.topRowText}>
          Score: <Text style={styles.scoreBlue}>{score}</Text>
        </Text>
      </View>

      <View style={styles.statusContainer}>
        <View style={styles.statusRow}>
          <Text style={styles.statusLeft}>Next Tile Spawn</Text>
          <Text style={styles.statusRight}>{spawnSpeedText}</Text>
        </View>
        <View style={styles.progressBarBg}>
          <View style={[styles.progressBarFill, { width: `${spawnProgress}%` }]} />
        </View>
      </View>

      <View style={styles.sumRow}>
        <Text style={styles.sumDisplay}>{sum}</Text>
        <Text style={styles.sumDenom}>/ 10</Text>
      </View>

      <Text style={[styles.message, msgColorStyle]}>{message}</Text>
    </View>
  );
}
