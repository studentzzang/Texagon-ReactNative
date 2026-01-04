import React from "react";
import { View, Text, Pressable, Animated } from "react-native";
import Svg, { Polygon } from "react-native-svg";
import type { TileAnim } from "../../types/game";

export default function HexTile({
  id,
  r,
  c,
  a,
  value,
  st,
  sel,
  isPenalty,
  isBurst,
  fill,
  textColor,
  baseScale,
  hexPoints,
  HEX_W,
  HEX_H,
  HEX_GAP,
  tileOpacity,
  handleTilePress,
  styles,
}: {
  id: string;
  r: number;
  c: number;
  a: TileAnim;
  value: number | null;
  st: "empty" | "active";
  sel: boolean;
  isPenalty: boolean;
  isBurst: boolean;
  fill: string;
  textColor: string;
  baseScale: number;
  hexPoints: string;
  HEX_W: number;
  HEX_H: number;
  HEX_GAP: number;
  tileOpacity: number;
  handleTilePress: (r: number, c: number) => void;
  styles: any;
}) {
  const wrapperStyle = [
    styles.hexWrapper,
    { opacity: tileOpacity },
    // ✅ row gap/columnGap 대신 타일 자체 margin으로 간격 고정
    { marginHorizontal: Math.round(HEX_GAP / 2) },
  ];

  const scale = Animated.multiply(Animated.multiply(a.scale, a.selScale), baseScale);

  return (
    <View style={wrapperStyle}>
      <Pressable
        onPress={() => handleTilePress(r, c)}
        disabled={st === "empty"}
        style={styles.hexPress}
      >
        <Animated.View
          style={{
            // ✅ 레이아웃 박스 고정 (안드 흔들림 방지 핵심)
            width: HEX_W,
            height: HEX_H,
            alignItems: "center",
            justifyContent: "center",

            transform: [
              { translateX: a.tx },
              { scale },
            ],
            opacity: a.opacity,
          }}
        >
          <Svg width={HEX_W} height={HEX_H} style={styles.hexSvg}>
            {st !== "empty" && !sel && (
              <Polygon
                points={hexPoints}
                fill="rgba(0,0,0,0.10)"
                transform="translate(0,2)"
              />
            )}

            {st !== "empty" && sel && (
              <Polygon
                points={hexPoints}
                fill="rgba(59,130,246,0.25)"
                transform="translate(0,0)"
              />
            )}

            <Polygon points={hexPoints} fill={fill} />
          </Svg>

          <View style={styles.hexTextWrap}>
            <Text
              selectable={false}
              style={[
                styles.hexText,
                { color: textColor },
                sel && styles.hexTextSelected,
              ]}
            >
              {typeof value === "number" ? String(value) : ""}
            </Text>
          </View>
        </Animated.View>
      </Pressable>
    </View>
  );
}
