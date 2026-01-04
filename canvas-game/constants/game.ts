import { Dimensions } from "react-native";

const { width } = Dimensions.get("window");

export const ROW_COUNTS = [5, 6, 5, 6, 5];

export const START_TILE_NUM = 10;

const GRID_PADDING = 50;
const MAX_COLS_PER_ROW = 6.5;

export const HEX_W = (width - GRID_PADDING) / MAX_COLS_PER_ROW;
export const HEX_H = HEX_W * 1.15;
export const HEX_GAP = 4;

export const COLOR_TILE = "#cbd5e1";
export const COLOR_EMPTY = "#e2e8f0";
export const COLOR_BG_GRID = "#f8fafc";