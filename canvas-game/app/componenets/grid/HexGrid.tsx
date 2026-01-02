import React from "react";
import { View } from "react-native";
import HexTile from "./HexTile";
import { keyOf, idOf } from "../../utils/grid";
import type { TileMap } from "../../types/game";

export default function HexGrid({
  ROW_COUNTS,
  HEX_W,
  HEX_H,
  HEX_GAP,
  hexPoints,
  ensureAnim,
  tileData,
  tileState,
  isSelected,
  tileFill,
  tileOpacity,
  tileScaleFactor,
  penaltyIds,
  burstIds,
  handleTilePress,
  styles,
}: {
  ROW_COUNTS: number[];
  HEX_W: number;
  HEX_H: number;
  HEX_GAP: number;
  hexPoints: string;
  ensureAnim: (id: string) => any;
  tileData: TileMap;
  tileState: (r: number, c: number) => "empty" | "active";
  isSelected: (r: number, c: number) => boolean;
  tileFill: (r: number, c: number) => string;
  tileOpacity: (r: number, c: number) => number;
  tileScaleFactor: () => number;
  penaltyIds: Record<string, true>;
  burstIds: Record<string, true>;
  handleTilePress: (r: number, c: number) => void;
  styles: any;
}) {
  return (
    <View style={styles.gridContainer}>
      {ROW_COUNTS.map((count, r) => {
        return (
          <View key={`row-${r}`} style={[styles.hexRow, r !== ROW_COUNTS.length - 1 && styles.hexRowOverlap]}>
            {Array.from({ length: count }).map((_, c) => {
              const id = idOf(r, c);

              const a = ensureAnim(id);
              const value = tileData[keyOf(r, c)];
              const st = tileState(r, c);
              const sel = isSelected(r, c);

              const isPenalty = !!penaltyIds[id];
              const isBurst = !!burstIds[id];

              const fill =
                isPenalty ? "#f97316" : // >10 주황
                isBurst ? "#10b981" :   // =10 초록
                tileFill(r, c);

              const textColor =
                st === "empty" ? "transparent" :
                isPenalty || isBurst ? "#ffffff" :
                sel ? "#ffffff" :
                "#1e293b";

              const baseScale = tileScaleFactor();

              return (
                <HexTile
                  key={id}
                  id={id}
                  r={r}
                  c={c}
                  a={a}
                  value={value ?? null}
                  st={st}
                  sel={sel}
                  isPenalty={isPenalty}
                  isBurst={isBurst}
                  fill={fill}
                  textColor={textColor}
                  baseScale={baseScale}
                  hexPoints={hexPoints}
                  HEX_W={HEX_W}
                  HEX_H={HEX_H}
                  tileOpacity={tileOpacity(r, c)}
                  handleTilePress={handleTilePress}
                  styles={styles}
                />
              );
            })}
          </View>
        );
      })}
    </View>
  );
}
