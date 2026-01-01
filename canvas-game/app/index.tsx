// app/index.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  Animated,
  Easing,
  Dimensions,
} from "react-native";
import Svg, {
  Defs,
  Filter,
  FeDropShadow,
  Polygon,
  Text as SvgText,
} from "react-native-svg";

type Coord = { r: number; c: number };
type TileValue = number | null;
type TileData = Record<string, TileValue>;
type MsgStyle = { color: string; weight?: "700" | "800" | "900"; scale?: number };

const ROW_COUNTS = [5, 6, 5, 6, 5];

// 육각형 커스텀
const HEX_W = 70;
const HEX_H = 92; 
const HEX_GAP = 8;

// colors (HTML과 맞춤)
const COLOR_BG = "#e2e8f0";
const COLOR_CONTAINER = "#ffffff";
const COLOR_BG_GRID = "#f8fafc";
const COLOR_TILE = "#cbd5e1";
const COLOR_EMPTY = "#e2e8f0";
const COLOR_SELECTED = "#3b82f6";
const COLOR_PENALTY = "#f97316";
const COLOR_BURST = "#10b981";
const COLOR_TEXT_DARK = "#1e293b";
const COLOR_TEXT_MUTED = "#64748b";

const HEX_POINTS = "50,0 100,25 100,75 50,100 0,75 0,25";

const keyOf = (r: number, c: number) => `${r},${c}`;
const randInt = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

function isValidCoord(c: any): c is Coord {
  return !!c && Number.isInteger(c.r) && Number.isInteger(c.c);
}
function isValidPair(coords: any): coords is [Coord, Coord] {
  return (
    Array.isArray(coords) &&
    coords.length === 2 &&
    isValidCoord(coords[0]) &&
    isValidCoord(coords[1])
  );
}

export default function Index() {
  const [started, setStarted] = useState(false);

  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);

  const [tileData, setTileData] = useState<TileData>({});
  const [selectedCoords, setSelectedCoords] = useState<Coord[]>([]);
  const [sum, setSum] = useState(0);

  const [message, setMessage] = useState("");
  const [messageStyle, setMessageStyle] = useState<MsgStyle>({
    color: COLOR_TEXT_MUTED,
    weight: "800",
  });

  const [gameOverVisible, setGameOverVisible] = useState(false);
  const [gameOverReason, setGameOverReason] = useState(
    "더 이상 연결할 수 있는 이웃 타일이 없습니다!"
  );

  // spawn gauge
  const spawnProgress = useRef(0);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const rafId = useRef<number | null>(null);
  const lastTs = useRef<number>(0);

  // per-tile anim values
  const scaleMap = useRef<Record<string, Animated.Value>>({});
  const shakeMap = useRef<Record<string, Animated.Value>>({});
  const opacityMap = useRef<Record<string, Animated.Value>>({});
  const pressMap = useRef<Record<string, Animated.Value>>({}); // ======= 여기(2) : 눌렀을 때 spring =======
  const burstFlag = useRef<Record<string, boolean>>({}); // for burst color

  const ensureAnim = (key: string) => {
    if (!scaleMap.current[key]) scaleMap.current[key] = new Animated.Value(1);
    if (!shakeMap.current[key]) shakeMap.current[key] = new Animated.Value(0);
    if (!opacityMap.current[key]) opacityMap.current[key] = new Animated.Value(1);
    if (!pressMap.current[key]) pressMap.current[key] = new Animated.Value(1);
  };

  const resetTileAnims = () => {
    Object.keys(scaleMap.current).forEach((k) => scaleMap.current[k].setValue(1));
    Object.keys(shakeMap.current).forEach((k) => shakeMap.current[k].setValue(0));
    Object.keys(opacityMap.current).forEach((k) => opacityMap.current[k].setValue(1));
    Object.keys(pressMap.current).forEach((k) => pressMap.current[k].setValue(1));
    burstFlag.current = {};
  };

  const spawnSpeed = useMemo(() => {
    // HTML: Math.max(1300, (5000 - (level - 1) * 400) * 0.85);
    return Math.max(1300, (5000 - (level - 1) * 400) * 0.85);
  }, [level]);

  const spawnSpeedText = useMemo(() => {
    if (level < 3) return "Normal";
    if (level < 6) return "Fast";
    if (level < 9) return "Very Fast";
    return "Extreme";
  }, [level]);

  const showMessage = (msg: string, style: MsgStyle) => {
    setMessage(msg);
    setMessageStyle(style);
  };

  const updateLevelByScore = (s: number) => {
    const newLevel = Math.floor(s / 200) + 1;
    if (newLevel !== level) {
      setLevel(newLevel);
      showMessage("LEVEL UP! 속도가 빨라집니다!", {
        color: "#7c3aed",
        weight: "900",
        scale: 1.1,
      });
    }
  };

  const getNeighbors = (r: number, c: number): Coord[] => {
    const neighbors: Coord[] = [];
    neighbors.push({ r, c: c - 1 }, { r, c: c + 1 });

    const isShortRow = ROW_COUNTS[r] === 5;
    [r - 1, r + 1].forEach((vr) => {
      if (vr < 0 || vr >= ROW_COUNTS.length) return;
      if (isShortRow) {
        neighbors.push({ r: vr, c }, { r: vr, c: c + 1 });
      } else {
        neighbors.push({ r: vr, c: c - 1 }, { r: vr, c });
      }
    });

    return neighbors.filter((n) => n.c >= 0 && n.c < ROW_COUNTS[n.r]);
  };

  const checkAdjacent = (coords: [Coord, Coord]) => {
    if (!isValidPair(coords)) return false;
    const neighbors = getNeighbors(coords[0].r, coords[0].c);
    return neighbors.some((n) => n.r === coords[1].r && n.c === coords[1].c);
  };

  const checkGameOver_NoAdjacentMoves = (data: TileData) => {
    const activeKeys = Object.keys(data).filter((k) => data[k] !== null);
    if (activeKeys.length === 0) return false;

    for (const k of activeKeys) {
      const [r, c] = k.split(",").map(Number);
      const neighbors = getNeighbors(r, c);
      for (const nb of neighbors) {
        if (data[keyOf(nb.r, nb.c)] !== null) return false;
      }
    }
    return true;
  };

  const triggerGameOver = (reason: string) => {
    if (rafId.current != null) cancelAnimationFrame(rafId.current);
    rafId.current = null;
    setGameOverReason(reason);
    setGameOverVisible(true);
  };

  const checkBoardStatus = (data: TileData) => {
    if (checkGameOver_NoAdjacentMoves(data)) {
      triggerGameOver("더 이상 연결할 수 있는 이웃 타일이 없습니다!");
    }
  };

  // ======= Animations (HTML 이펙트 대응) =======
  const animatePop = (key: string) => {
    ensureAnim(key);
    scaleMap.current[key].setValue(0.3);
    opacityMap.current[key].setValue(1);
    Animated.timing(scaleMap.current[key], {
      toValue: 1,
      duration: 400,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      useNativeDriver: true,
    }).start();
  };

  const animateTilePulse = (key: string) => {
    ensureAnim(key);
    scaleMap.current[key].setValue(1.3);
    Animated.timing(scaleMap.current[key], {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const animateShakePenalty = (key: string) => {
    ensureAnim(key);
    shakeMap.current[key].setValue(0);
    Animated.sequence([
      Animated.timing(shakeMap.current[key], { toValue: -4, duration: 75, useNativeDriver: true }),
      Animated.timing(shakeMap.current[key], { toValue: 4, duration: 75, useNativeDriver: true }),
      Animated.timing(shakeMap.current[key], { toValue: -4, duration: 75, useNativeDriver: true }),
      Animated.timing(shakeMap.current[key], { toValue: 0, duration: 75, useNativeDriver: true }),
    ]).start();
  };

  const animateBurst = (key: string) => {
    ensureAnim(key);
    burstFlag.current[key] = true;
    scaleMap.current[key].setValue(1.1);
    opacityMap.current[key].setValue(1);

    Animated.sequence([
      Animated.timing(scaleMap.current[key], {
        toValue: 1.5,
        duration: 200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.parallel([
        Animated.timing(scaleMap.current[key], {
          toValue: 0,
          duration: 300,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(opacityMap.current[key], {
          toValue: 0,
          duration: 300,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      scaleMap.current[key].setValue(1);
      opacityMap.current[key].setValue(1);
      burstFlag.current[key] = false;
    });
  };

  // ======= Spawn Timer =======
  const spawnNumbers = (n: number, data: TileData) => {
    const emptyKeys = Object.keys(data).filter((k) => data[k] === null);
    const count = Math.min(n, emptyKeys.length);
    const shuffled = [...emptyKeys].sort(() => 0.5 - Math.random());

    const next = { ...data };
    for (let i = 0; i < count; i++) {
      const k = shuffled[i];
      next[k] = randInt(1, 9);
    }
    return next;
  };

  const updateSpawnTimer = (ts: number) => {
    if (gameOverVisible) return;

    if (!lastTs.current) lastTs.current = ts;
    const delta = ts - lastTs.current;
    lastTs.current = ts;

    spawnProgress.current += (delta / spawnSpeed) * 100;

    if (spawnProgress.current >= 100) {
      spawnProgress.current = 0;

      setTileData((prev) => {
        const emptyCount = Object.values(prev).filter((v) => v === null).length;
        if (emptyCount <= 0) {
          triggerGameOver("보드가 가득 찼습니다!");
          return prev;
        }

        const next = spawnNumbers(1, prev);

        // pop newly spawned tile(s)
        for (const k of Object.keys(next)) {
          if (prev[k] === null && next[k] !== null) animatePop(k);
        }

        setTimeout(() => checkBoardStatus(next), 0);
        return next;
      });
    }

    Animated.timing(progressAnim, {
      toValue: spawnProgress.current,
      duration: 100,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    rafId.current = requestAnimationFrame(updateSpawnTimer);
  };

  // ======= Init =======
  const initGame = () => {
    if (rafId.current != null) cancelAnimationFrame(rafId.current);

    setGameOverVisible(false);
    setScore(0);
    setLevel(1);
    setSelectedCoords([]);
    setSum(0);

    showMessage("게임을 시작합니다!", { color: COLOR_TEXT_MUTED, weight: "800" });

    const base: TileData = {};
    ROW_COUNTS.forEach((count, r) => {
      for (let c = 0; c < count; c++) {
        const k = keyOf(r, c);
        base[k] = null;
        ensureAnim(k);
      }
    });

    resetTileAnims();

    const seeded = spawnNumbers(8, base);
    for (const k of Object.keys(seeded)) {
      if (base[k] === null && seeded[k] !== null) animatePop(k);
    }

    setTileData(seeded);

    spawnProgress.current = 0;
    progressAnim.setValue(0);
    lastTs.current = 0;

    rafId.current = requestAnimationFrame(updateSpawnTimer);
  };

  const startGame = () => {
    setStarted(true);
    initGame();
  };

  // ======= Game logic (HTML 동일) =======
  const resetSelection = () => {
    setSelectedCoords([]);
    setSum(0);
  };

  const applyStatusVisuals = (kind: "penalty" | "selected") => {
    if (kind === "penalty") {
      selectedCoords.forEach((coord) => animateShakePenalty(keyOf(coord.r, coord.c)));
    }
  };

  const burstTiles = (coordsPair: [Coord, Coord]) => {
    if (!isValidPair(coordsPair)) return;

    const burstList = [...coordsPair] as [Coord, Coord];

    const newScore = score + 20;
    setScore(newScore);
    updateLevelByScore(newScore);

    showMessage("GREAT! 10 성공!", { color: "#16a34a", weight: "900" });

    burstList.forEach((coord) => animateBurst(keyOf(coord.r, coord.c)));

    resetSelection();

    setTimeout(() => {
      setTileData((prev) => {
        const next = { ...prev };
        burstList.forEach((coord) => (next[keyOf(coord.r, coord.c)] = null));
        setTimeout(() => checkBoardStatus(next), 0);
        return next;
      });
    }, 500);
  };

  const processOverTen = (coords: [Coord, Coord]) => {
    if (!isValidPair(coords)) return;

    const src = coords[0];
    const dst = coords[1];

    setTileData((prev) => {
      const next = { ...prev };
      const v1 = next[keyOf(src.r, src.c)];
      const v2 = next[keyOf(dst.r, dst.c)];
      if (v1 == null || v2 == null) return prev;

      const remainder = v1 + v2 - 10;

      next[keyOf(src.r, src.c)] = null;
      next[keyOf(dst.r, dst.c)] = remainder;

      animateTilePulse(keyOf(dst.r, dst.c));
      return next;
    });

    resetSelection();

    // spawn 1
    setTileData((prev) => {
      const emptyCount = Object.values(prev).filter((v) => v === null).length;
      if (emptyCount <= 0) {
        triggerGameOver("보드가 가득 찼습니다!");
        return prev;
      }
      const next = spawnNumbers(1, prev);
      for (const k of Object.keys(next)) {
        if (prev[k] === null && next[k] !== null) animatePop(k);
      }
      setTimeout(() => checkBoardStatus(next), 0);
      return next;
    });
  };

  const updateTilesAfterOperation = (coords: [Coord, Coord], newValue: number) => {
    const a = coords[0];
    const b = coords[1];

    setTileData((prev) => {
      const next = { ...prev };
      next[keyOf(a.r, a.c)] = null;
      next[keyOf(b.r, b.c)] = newValue;

      animateTilePulse(keyOf(b.r, b.c));
      return next;
    });

    resetSelection();
  };

  const processUnderTen = (coords: [Coord, Coord]) => {
    if (!isValidPair(coords)) return;

    const v1 = tileData[keyOf(coords[0].r, coords[0].c)];
    const v2 = tileData[keyOf(coords[1].r, coords[1].c)];
    if (v1 == null || v2 == null) return;

    const newValue = v1 + v2;

    updateTilesAfterOperation(coords, newValue);

    // spawn 1
    setTileData((prev) => {
      const emptyCount = Object.values(prev).filter((v) => v === null).length;
      if (emptyCount <= 0) {
        triggerGameOver("보드가 가득 찼습니다!");
        return prev;
      }
      const next = spawnNumbers(1, prev);
      for (const k of Object.keys(next)) {
        if (prev[k] === null && next[k] !== null) animatePop(k);
      }
      setTimeout(() => checkBoardStatus(next), 0);
      return next;
    });
  };

  const handleTileClick = (r: number, c: number) => {
    const k = keyOf(r, c);
    if (tileData[k] === null) return;
    if (gameOverVisible) return;

    const existingIdx = selectedCoords.findIndex((p) => p.r === r && p.c === c);

    // toggle off
    if (existingIdx > -1) {
      const nextSel = [...selectedCoords];
      nextSel.splice(existingIdx, 1);
      setSelectedCoords(nextSel);

      const currentSum = nextSel.reduce(
        (acc, coord) => acc + (tileData[keyOf(coord.r, coord.c)] ?? 0),
        0
      );
      setSum(currentSum);
      return;
    }

    if (selectedCoords.length >= 2) return;

    const nextSel = [...selectedCoords, { r, c }];
    setSelectedCoords(nextSel);

    const currentSum = nextSel.reduce(
      (acc, coord) => acc + (tileData[keyOf(coord.r, coord.c)] ?? 0),
      0
    );
    setSum(currentSum);

    if (nextSel.length === 2) {
      const pairSnapshot: [Coord, Coord] = [{ ...nextSel[0] }, { ...nextSel[1] }];

      if (!checkAdjacent(pairSnapshot)) {
        showMessage("타일이 서로 붙어있어야 합니다!", { color: "#dc2626", weight: "900" });
        applyStatusVisuals("penalty");
        setTimeout(resetSelection, 600);
        return;
      }

      if (currentSum === 10) {
        burstTiles(pairSnapshot);
      } else if (currentSum > 10) {
        showMessage(`${currentSum} 초과! (합-10) 생성!`, { color: COLOR_PENALTY, weight: "900" });
        applyStatusVisuals("penalty");
        setTimeout(() => processOverTen(pairSnapshot), 600);
      } else {
        showMessage(`${currentSum} 미만! 숫자를 합칩니다.`, { color: COLOR_SELECTED, weight: "900" });
        setTimeout(() => processUnderTen(pairSnapshot), 600);
      }
    } else {
      showMessage("이웃한 숫자를 선택하세요.", { color: COLOR_SELECTED, weight: "900" });
    }
  };

  // minimal self-tests
  useEffect(() => {
    try {
      console.assert(isValidCoord({ r: 0, c: 0 }) === true, "T1 isValidCoord failed");
      console.assert(isValidCoord({ r: 0 }) === false, "T2 isValidCoord should fail");
      console.assert(
        isValidPair([{ r: 0, c: 0 }, { r: 0, c: 1 }]) === true,
        "T3 isValidPair failed"
      );
      console.assert(isValidPair([{ r: 0, c: 0 }]) === false, "T4 isValidPair should fail");
      console.assert(isValidPair([]) === false, "T5 isValidPair should fail");
      console.assert(
        checkAdjacent([{ r: 0, c: 0 }, { r: 0, c: 1 }]) === true,
        "T6 adjacency expected true"
      );
    } catch (e) {
      // noop
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ======= Render helpers =======
  const isSelected = (r: number, c: number) =>
    selectedCoords.some((p) => p.r === r && p.c === c);

  const isPenalty = (r: number, c: number) => {
    if (!isSelected(r, c)) return false;
    if (selectedCoords.length !== 2) return false;
    return messageStyle.color === COLOR_PENALTY || messageStyle.color === "#dc2626";
  };

  const tileFill = (r: number, c: number, v: TileValue) => {
    const k = keyOf(r, c);
    if (v === null) return COLOR_EMPTY;
    if (burstFlag.current[k]) return COLOR_BURST;
    if (isPenalty(r, c)) return COLOR_PENALTY;
    if (isSelected(r, c)) return COLOR_SELECTED;
    return COLOR_TILE;
  };

  const tileTextColor = (r: number, c: number, v: TileValue) => {
    if (v === null) return "transparent";
    if (isSelected(r, c) || isPenalty(r, c)) return "#ffffff";
    return COLOR_TEXT_DARK;
  };

  const messageScale = messageStyle.scale ?? 1;

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  const screenW = Dimensions.get("window").width;
  const containerW = Math.min(screenW * 0.95, 520);

  return (
    <View style={[styles.body, { backgroundColor: COLOR_BG }]}>
      <View style={[styles.gameContainer, { width: containerW }]}>
        {/* Start Overlay */}
        {!started && (
          <View style={styles.startOverlay}>
            <Pressable
              onPress={startGame}
              style={({ pressed }) => [
                styles.startButton,
                pressed && { transform: [{ scale: 0.95 }] },
              ]}
            >
              <Text style={styles.startButtonText}>시작하기</Text>
            </Pressable>
          </View>
        )}

        {/* Game Over Modal */}
        {gameOverVisible && (
          <View style={styles.gameOverModal}>
            <Text style={styles.gameOverTitle}>GAME OVER</Text>
            <Text style={styles.gameOverReason}>{gameOverReason}</Text>
            <Text style={styles.gameOverScore}>
              최종 점수: <Text style={styles.gameOverScoreValue}>{score}</Text>
            </Text>
            <Pressable
              onPress={initGame}
              style={({ pressed }) => [
                styles.retryButton,
                pressed && { transform: [{ scale: 0.95 }] },
              ]}
            >
              <Text style={styles.retryButtonText}>다시 시도</Text>
            </Pressable>
          </View>
        )}

        {/* Score Board */}
        <View style={styles.scoreBoard}>
          <Text style={styles.h1}>숫자 터트리기</Text>

          <View style={styles.scoreRow}>
            <Text style={styles.metaText}>
              Lv.<Text style={styles.metaValue}>{level}</Text>
            </Text>
            <Text style={styles.metaText}>
              Score: <Text style={styles.scoreValue}>{score}</Text>
            </Text>
          </View>

          {/* Auto Spawn Gauge */}
          <View style={styles.statusContainer}>
            <View style={styles.statusHeader}>
              <Text style={styles.statusLabel}>Next Tile Spawn</Text>
              <Text style={styles.statusLabel}>{spawnSpeedText}</Text>
            </View>
            <View style={styles.progressBarBg}>
              <Animated.View style={[styles.progressBarFill, { width: progressWidth }]} />
            </View>
          </View>

          <View style={styles.sumRow}>
            <Text style={styles.sumValue}>{sum}</Text>
            <Text style={styles.sumDen}>/ 10</Text>
          </View>

          <Animated.Text
            style={[
              styles.message,
              {
                color: messageStyle.color,
                fontWeight: messageStyle.weight ?? "800",
                transform: [{ scale: messageScale }],
              },
            ]}
            numberOfLines={1}
          >
            {message}
          </Animated.Text>
        </View>

        {/* Grid */}
        <View style={styles.hexGridContainer}>
          {ROW_COUNTS.map((count, r) => (
            <View key={`row-${r}`} style={styles.hexRow}>
              {Array.from({ length: count }).map((_, c) => {
                const k = keyOf(r, c);
                ensureAnim(k);

                const v = tileData[k] ?? null;
                const disabled = v === null;

                const selected = isSelected(r, c);
                const fill = tileFill(r, c, v);
                const tColor = tileTextColor(r, c, v);

                // ======= 여기(2) : 누를 때 자연스럽게 spring scale =======
                const baseSelectedScale = selected ? 1.1 : 1;
                const animatedScale = Animated.multiply(
                  Animated.multiply(scaleMap.current[k], pressMap.current[k]),
                  baseSelectedScale
                );

                const translateX = shakeMap.current[k];
                const opacity = opacityMap.current[k];

                return (
                  <Pressable
                    key={`hex-${r}-${c}`}
                    onPress={() => handleTileClick(r, c)}
                    onPressIn={() => {
                      if (disabled) return;
                      Animated.spring(pressMap.current[k], {
                        toValue: 1.08,
                        useNativeDriver: true,
                        friction: 6,
                        tension: 160,
                      }).start();
                    }}
                    onPressOut={() => {
                      if (disabled) return;
                      Animated.spring(pressMap.current[k], {
                        toValue: 1,
                        useNativeDriver: true,
                        friction: 6,
                        tension: 160,
                      }).start();
                    }}
                    disabled={disabled}
                    style={[styles.hexPressable, { marginHorizontal: HEX_GAP / 2 }]}
                  >
                    {/* ======= 여기(3) : View shadow 제거 (네모 테두리 문제 원인) ======= */}
                    <Animated.View
                      style={[
                        styles.hexWrapper,
                        disabled && styles.hexDisabled,
                        {
                          opacity,
                          transform: [{ translateX }, { scale: animatedScale }],
                        },
                      ]}
                    >
                      <Svg width={HEX_W} height={HEX_H} viewBox="0 0 100 100">
                        {/* 선택/패널티 글로우: filter (지원 안 되면 아래 fake shadow만으로도 네모 문제는 해결됨) */}
                        <Defs>
                          <Filter id="glowBlue" x="-50%" y="-50%" width="200%" height="200%">
                            <FeDropShadow
                              dx="0"
                              dy="0"
                              stdDeviation="6"
                              floodColor="rgba(59,130,246,0.6)"
                            />
                          </Filter>
                          <Filter id="glowOrange" x="-50%" y="-50%" width="200%" height="200%">
                            <FeDropShadow
                              dx="0"
                              dy="0"
                              stdDeviation="5"
                              floodColor="rgba(249,115,22,0.55)"
                            />
                          </Filter>
                        </Defs>

                        {/* ✅ “육각형 모양” 그림자: 네모 shadow 문제를 원천 해결 */}
                        {v !== null && !selected && !isPenalty(r, c) && !burstFlag.current[k] && (
                          <Polygon
                            points={HEX_POINTS}
                            fill="rgba(0,0,0,0.12)"
                            transform="translate(0 2)"
                          />
                        )}

                        <Polygon
                          points={HEX_POINTS}
                          fill={fill}
                          filter={
                            v === null
                              ? undefined
                              : isPenalty(r, c)
                              ? "url(#glowOrange)"
                              : selected
                              ? "url(#glowBlue)"
                              : undefined
                          }
                        />

                        {v != null && (
                          <SvgText
                            x="50"
                            y="58"
                            fontSize="32"
                            fontWeight="900"
                            fill={tColor}
                            textAnchor="middle"
                          >
                            {v}
                          </SvgText>
                        )}
                      </Svg>
                    </Animated.View>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.tipWrap}>
          <Text style={styles.tipText}>
            10 완성 시 빈 타일 추가 생성 없음! 보드를 비워 공간을 확보하세요.
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  gameContainer: {
    position: "relative",
    padding: 30,
    backgroundColor: COLOR_CONTAINER,
    borderRadius: 32,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 25,
    shadowOffset: { width: 0, height: 25 },
    elevation: 12,
  },

  startOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.90)",
    zIndex: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  startButton: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    backgroundColor: "#2563eb",
    borderRadius: 18,
  },
  startButtonText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
  },

  gameOverModal: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
    backgroundColor: "rgba(255,255,255,0.95)",
    zIndex: 100,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  gameOverTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "#ef4444",
    marginBottom: 8,
  },
  gameOverReason: {
    color: "#64748b",
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 18,
  },
  gameOverScore: {
    fontSize: 22,
    fontWeight: "900",
    color: "#334155",
    marginBottom: 22,
  },
  gameOverScoreValue: {
    color: "#2563eb",
    fontWeight: "900",
  },
  retryButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: "#2563eb",
    borderRadius: 18,
  },
  retryButtonText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
  },

  scoreBoard: {
    alignItems: "center",
    marginBottom: 10,
  },
  h1: {
    fontSize: 30,
    fontWeight: "900",
    color: "#1f2937",
    marginBottom: 6,
  },
  scoreRow: {
    width: "100%",
    paddingHorizontal: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  metaText: {
    fontSize: 18,
    fontWeight: "800",
    color: "#64748b",
  },
  metaValue: {
    color: "#64748b",
    fontWeight: "800",
  },
  scoreValue: {
    color: "#2563eb",
    fontWeight: "900",
  },

  statusContainer: {
    width: "100%",
    marginTop: 8,
    marginBottom: 2,
  },
  statusHeader: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: -0.2,
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
    marginTop: 5,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
  },

  sumRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    marginTop: 10,
  },
  sumValue: {
    color: "#f97316",
    fontSize: 40,
    fontWeight: "900",
  },
  sumDen: {
    color: "#94a3b8",
    fontSize: 20,
    fontWeight: "900",
    paddingBottom: 6,
  },

  message: {
    height: 24,
    marginTop: 12,
    fontSize: 13,
    fontWeight: "900",
  },

  hexGridContainer: {
    marginTop: 10,
    padding: 25,
    backgroundColor: COLOR_BG_GRID,
    borderRadius: 24,
    alignItems: "center",
    overflow: "visible",
  },
  hexRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: -20,
  },

  hexPressable: {
    width: HEX_W,
    height: HEX_H,
  },
  hexWrapper: {
    width: HEX_W,
    height: HEX_H,
    alignItems: "center",
    justifyContent: "center",
  },
  hexDisabled: {
    opacity: 0.5,
  },

  tipWrap: {
    marginTop: 32,
    alignItems: "center",
  },
  tipText: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "800",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    textAlign: "center",
  },
});
