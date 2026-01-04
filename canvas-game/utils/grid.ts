import { ROW_COUNTS } from "../constants/game";
import type { Coord, TileMap } from "../types/game";

export function keyOf(r: number, c: number) {
  return `${r},${c}`;
}
export function idOf(r: number, c: number) {
  return `hex-${r}-${c}`;
}

export function isValidCoord(c: any): c is Coord {
  return !!c && Number.isInteger(c.r) && Number.isInteger(c.c);
}
export function isValidPair(coords: any): coords is [Coord, Coord] {
  return Array.isArray(coords) && coords.length === 2 && isValidCoord(coords[0]) && isValidCoord(coords[1]);
}

export function pointsForHex(w: number, h: number) {
  // CSS clip-path polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)
  const p = [
    [w * 0.5, h * 0.0],
    [w * 1.0, h * 0.25],
    [w * 1.0, h * 0.75],
    [w * 0.5, h * 1.0],
    [w * 0.0, h * 0.75],
    [w * 0.0, h * 0.25],
  ];
  return p.map(([x, y]) => `${x},${y}`).join(" ");
}

export function getNeighbors(r: number, c: number) {
  const neighbors: Coord[] = [];
  neighbors.push({ r, c: c - 1 });
  neighbors.push({ r, c: c + 1 });

  const isShortRow = ROW_COUNTS[r] === 5;
  const verticalRows = [r - 1, r + 1];

  verticalRows.forEach((vr) => {
    if (vr < 0 || vr >= ROW_COUNTS.length) return;
    if (isShortRow) {
      neighbors.push({ r: vr, c: c });
      neighbors.push({ r: vr, c: c + 1 });
    } else {
      neighbors.push({ r: vr, c: c - 1 });
      neighbors.push({ r: vr, c: c });
    }
  });

  return neighbors.filter((n) => n.c >= 0 && n.c < ROW_COUNTS[n.r]);
}

export function checkAdjacent(coords: [Coord, Coord]) {
  if (!isValidPair(coords)) return false;
  const n = getNeighbors(coords[0].r, coords[0].c);
  return n.some((x) => x.r === coords[1].r && x.c === coords[1].c);
}

export function checkGameOver(map: TileMap) {
  const activeKeys = Object.keys(map).filter((k) => map[k] !== null);
  if (activeKeys.length === 0) return false;

  for (const k of activeKeys) {
    const [r, c] = k.split(",").map(Number);
    const neighbors = getNeighbors(r, c);
    for (const nb of neighbors) {
      if (map[keyOf(nb.r, nb.c)] !== null) return false;
    }
  }
  return true;
}
