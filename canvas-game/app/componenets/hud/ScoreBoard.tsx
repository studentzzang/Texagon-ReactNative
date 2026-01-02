import React from "react";
import { View, Text, Animated } from "react-native";

export default function ScoreBoard({
  level,
  score,
  highScore,
  highWobble,         
  spawnSpeedText,
  spawnProgress,
  sum,
  message,
  msgColorStyle,
  styles,
}: {
  level: number;
  score: number;
  highScore: number;
  highWobble: Animated.Value; 
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

        <View style={{ alignItems: "flex-end" }}>
          <View style={{ flexDirection: "row", alignItems: "baseline" }}>
            <Text style={styles.topRowText}>High: </Text>

            <Animated.Text
                style={[
                styles.topRowText,
                styles.scoreOrange,
                
                {
                    transform: [
                    {
                        translateX: highWobble.interpolate({
                        inputRange: [-1, 1],
                        outputRange: [-4,4],
                        }),
                    },
                    ],
                },
                ]}
            >
                {highScore}
            </Animated.Text>
            </View>


          <Text style={styles.topRowText}>
            Score: <Text style={styles.scoreBlue}>{score}</Text>
          </Text>
        </View>
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
