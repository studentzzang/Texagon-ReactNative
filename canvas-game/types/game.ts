import { Animated } from "react-native";

export type Coord = { r: number; c: number };
export type TileMap = Record<string, number | null>;

export type TileAnim = {
  scale: Animated.Value;     // FX용(pop/pulse/burst)
  selScale: Animated.Value;  // ✅ 선택용(유지)
  opacity: Animated.Value;
  tx: Animated.Value;
};