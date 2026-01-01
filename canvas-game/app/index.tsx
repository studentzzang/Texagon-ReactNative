// App.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  SafeAreaView,
  Platform,
  Animated,
  Easing,
} from "react-native";
import Svg, { Polygon } from "react-native-svg";

type Coord = { r: number; c: number };
type TileMap = Record<string, number | null>;

const ROW_COUNTS = [5, 6, 5, 6, 5];

// :root CSS vars
const HEX_W = 70;
const HEX_H = 80;
const HEX_GAP = 8;

const COLOR_TILE = "#cbd5e1";
const COLOR_EMPTY = "#e2e8f0";
const COLOR_BG_GRID = "#f8fafc";

function keyOf(r: number, c: number) {
  return `${r},${c}`;
}
function idOf(r: number, c: number) {
  return `hex-${r}-${c}`;
}

function isValidCoord(c: any): c is Coord {
  return !!c && Number.isInteger(c.r) && Number.isInteger(c.c);
}
function isValidPair(coords: any): coords is [Coord, Coord] {
  return Array.isArray(coords) && coords.length === 2 && isValidCoord(coords[0]) && isValidCoord(coords[1]);
}

function pointsForHex(w: number, h: number) {
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

type TileAnim = {
  scale: Animated.Value;
  opacity: Animated.Value;
  tx: Animated.Value;
};

export default function App() {
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);

  const [selectedCoords, setSelectedCoords] = useState<Coord[]>([]);
  const [tileData, setTileData] = useState<TileMap>({});

  const [sum, setSum] = useState(0);
  const [message, setMessage] = useState("");
  const [messageClass, setMessageClass] = useState<"slate" | "red" | "orange" | "blue" | "green" | "purple">("slate");

  const [startOverlayVisible, setStartOverlayVisible] = useState(true);
  const [gameOverVisible, setGameOverVisible] = useState(false);
  const [gameOverReason, setGameOverReason] = useState("더 이상 연결할 수 있는 이웃 타일이 없습니다!");

  const [spawnProgress, setSpawnProgress] = useState(0); // 0..100
  const [spawnSpeedText, setSpawnSpeedText] = useState("Normal");

  const rafIdRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);

  const hexPoints = useMemo(() => pointsForHex(HEX_W, HEX_H), []);

  const animsRef = useRef<Record<string, TileAnim>>({});

  function ensureAnim(id: string) {
    if (!animsRef.current[id]) {
      animsRef.current[id] = {
        scale: new Animated.Value(1),
        opacity: new Animated.Value(1),
        tx: new Animated.Value(0),
      };
    }
    return animsRef.current[id];
  }

  function getSpawnSpeed(lv: number) {
    // return Math.max(1300, (5000 - (level - 1) * 400) * 0.85);
    return Math.max(1300, (5000 - (lv - 1) * 400) * 0.85);
  }

  function updateSpawnSpeedText(lv: number) {
    let t = "Normal";
    if (lv < 3) t = "Normal";
    else if (lv < 6) t = "Fast";
    else if (lv < 9) t = "Very Fast";
    else t = "Extreme";
    setSpawnSpeedText(t);
  }

  function showMessage(msg: string, cls: typeof messageClass) {
    setMessage(msg);
    setMessageClass(cls);
  }

  function getNeighbors(r: number, c: number) {
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

  function checkAdjacent(coords: [Coord, Coord]) {
    if (!isValidPair(coords)) return false;
    const n = getNeighbors(coords[0].r, coords[0].c);
    return n.some((x) => x.r === coords[1].r && x.c === coords[1].c);
  }

  function checkGameOver(map: TileMap) {
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

  function triggerGameOver() {
    if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;
    setGameOverVisible(true);
  }

  function checkBoardStatus(nextMap: TileMap) {
    if (checkGameOver(nextMap)) {
      setGameOverReason("더 이상 연결할 수 있는 이웃 타일이 없습니다!");
      triggerGameOver();
    }
  }

  function resetSelection(curSelected: Coord[]) {
    curSelected.forEach((coord) => {
      const id = idOf(coord.r, coord.c);
      const a = ensureAnim(id);
      a.tx.setValue(0);
      // selected/penalty 스타일은 렌더링에서 selectedCoords로 처리
    });
    setSelectedCoords([]);
    setSum(0);
  }

  function animatePop(id: string) {
    const a = ensureAnim(id);
    a.scale.stopAnimation();
    a.scale.setValue(0.3);
    Animated.timing(a.scale, {
      toValue: 1,
      duration: 400,
      easing: Easing.bezier(0.34, 1.56, 0.64, 1),
      useNativeDriver: true,
    }).start();
  }

  function animatePulse(id: string) {
    const a = ensureAnim(id);
    a.scale.stopAnimation();
    a.scale.setValue(1.3);
    Animated.timing(a.scale, {
      toValue: 1,
      duration: 300,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }

  function animateShake(ids: string[]) {
    ids.forEach((id) => {
      const a = ensureAnim(id);
      a.tx.stopAnimation();
      a.tx.setValue(0);
      Animated.sequence([
        Animated.timing(a.tx, { toValue: -4, duration: 75, useNativeDriver: true }),
        Animated.timing(a.tx, { toValue: 4, duration: 150, useNativeDriver: true }),
        Animated.timing(a.tx, { toValue: 0, duration: 75, useNativeDriver: true }),
      ]).start();
    });
  }

  function animateBurst(ids: string[]) {
    ids.forEach((id) => {
      const a = ensureAnim(id);
      a.scale.stopAnimation();
      a.opacity.stopAnimation();
      a.scale.setValue(1.1);
      a.opacity.setValue(1);
      Animated.parallel([
        Animated.timing(a.scale, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(a.opacity, {
          toValue: 0,
          duration: 500,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        a.scale.setValue(1);
        a.opacity.setValue(1);
      });
    });
  }

  function spawnNumbers(n: number) {
    setTileData((prev) => {
      const emptyKeys = Object.keys(prev).filter((k) => prev[k] === null);
      const count = Math.min(n, emptyKeys.length);
      const shuffled = [...emptyKeys].sort(() => 0.5 - Math.random());

      const next: TileMap = { ...prev };
      for (let i = 0; i < count; i++) {
        const k = shuffled[i];
        const [r, c] = k.split(",").map(Number);
        const val = Math.floor(Math.random() * 9) + 1;
        next[k] = val;

        animatePop(idOf(r, c));
      }
      return next;
    });
  }

  function updateLevel(nextScore: number) {
    const newLevel = Math.floor(nextScore / 200) + 1;
    setLevel((prevLv) => {
      if (newLevel !== prevLv) {
        updateSpawnSpeedText(newLevel);
        showMessage(`LEVEL UP! 속도가 빨라집니다!`, "purple");
      }
      return newLevel;
    });
  }

  function burstTiles(pairSnapshot: [Coord, Coord]) {
    if (!isValidPair(pairSnapshot)) return;

    const ids = pairSnapshot.map((c) => idOf(c.r, c.c));
    animateBurst(ids);

    const nextScore = score + 20;
    setScore(nextScore);
    updateLevel(nextScore);

    showMessage("GREAT! 10 성공!", "green");
    setSelectedCoords([]);
    setSum(0);

    setTimeout(() => {
      setTileData((prev) => {
        const next = { ...prev };
        pairSnapshot.forEach((c) => {
          next[keyOf(c.r, c.c)] = null;
        });
        // 10 정확히: 추가 숫자 생성 없음
        // checkBoardStatus
        setTimeout(() => checkBoardStatus(next), 0);
        return next;
      });
    }, 500);
  }

  function processOverTen(pairSnapshot: [Coord, Coord]) {
    if (!isValidPair(pairSnapshot)) return;

    setTileData((prev) => {
      const src = pairSnapshot[0];
      const dst = pairSnapshot[1];

      const v1 = prev[keyOf(src.r, src.c)] ?? 0;
      const v2 = prev[keyOf(dst.r, dst.c)] ?? 0;
      const remainder = v1 + v2 - 10;

      const next: TileMap = { ...prev };

      // src 제거
      next[keyOf(src.r, src.c)] = null;

      // dst에 초과분 남김
      next[keyOf(dst.r, dst.c)] = remainder;

      animatePulse(idOf(dst.r, dst.c));

      return next;
    });

    setSelectedCoords([]);
    setSum(0);

    spawnNumbers(1);
    setTimeout(() => {
      setTileData((cur) => {
        checkBoardStatus(cur);
        return cur;
      });
    }, 0);
  }

  function processUnderTen(pairSnapshot: [Coord, Coord]) {
    if (!isValidPair(pairSnapshot)) return;

    setTileData((prev) => {
      const v1 = prev[keyOf(pairSnapshot[0].r, pairSnapshot[0].c)] ?? 0;
      const v2 = prev[keyOf(pairSnapshot[1].r, pairSnapshot[1].c)] ?? 0;
      const newValue = v1 + v2;

      const next: TileMap = { ...prev };

      // key1 null
      next[keyOf(pairSnapshot[0].r, pairSnapshot[0].c)] = null;

      // key2 newValue
      next[keyOf(pairSnapshot[1].r, pairSnapshot[1].c)] = newValue;

      animatePulse(idOf(pairSnapshot[1].r, pairSnapshot[1].c));

      return next;
    });

    setSelectedCoords([]);
    setSum(0);

    spawnNumbers(1);
    setTimeout(() => {
      setTileData((cur) => {
        checkBoardStatus(cur);
        return cur;
      });
    }, 0);
  }

  function initGame() {
    if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
    rafIdRef.current = null;

    setGameOverVisible(false);
    setScore(0);
    setLevel(1);
    setSpawnProgress(0);
    updateSpawnSpeedText(1);

    setSelectedCoords([]);
    setSum(0);
    showMessage("게임을 시작합니다!", "slate");

    const base: TileMap = {};
    ROW_COUNTS.forEach((count, r) => {
      for (let c = 0; c < count; c++) {
        base[keyOf(r, c)] = null;
        ensureAnim(idOf(r, c));
        // reset anim values
        const a = ensureAnim(idOf(r, c));
        a.scale.setValue(1);
        a.opacity.setValue(1);
        a.tx.setValue(0);
      }
    });

    setTileData(base);

    // spawnNumbers(8) after state set
    setTimeout(() => spawnNumbers(8), 0);

    lastTsRef.current = (global as any)?.performance?.now?.() ?? Date.now();
    const loop = (ts: number) => {
      if (gameOverVisible) return;

      const last = lastTsRef.current;
      const delta = ts - last;
      lastTsRef.current = ts;

      const speed = getSpawnSpeed(level);
      setSpawnProgress((p) => {
        let next = p + (delta / speed) * 100;

        if (next >= 100) {
          next = 0;

          setTileData((prev) => {
            const emptyCount = Object.values(prev).filter((v) => v === null).length;
            if (emptyCount > 0) {
              // spawn 1 and check
              const emptyKeys = Object.keys(prev).filter((k) => prev[k] === null);
              const shuffled = [...emptyKeys].sort(() => 0.5 - Math.random());
              const pick = shuffled[0];
              const [r, c] = pick.split(",").map(Number);
              const val = Math.floor(Math.random() * 9) + 1;

              const nextMap: TileMap = { ...prev, [pick]: val };
              animatePop(idOf(r, c));

              // checkBoardStatus
              setTimeout(() => checkBoardStatus(nextMap), 0);
              return nextMap;
            } else {
              setGameOverReason("보드가 가득 찼습니다!");
              triggerGameOver();
              return prev;
            }
          });
        }
        return next;
      });

      rafIdRef.current = requestAnimationFrame(loop);
    };

    rafIdRef.current = requestAnimationFrame(loop);
  }

  function startGame() {
    setStartOverlayVisible(false);
    initGame();
  }

  function handleTilePress(r: number, c: number) {
    const k = keyOf(r, c);
    const v = tileData[k];
    if (v === null) return;

    const existingIdx = selectedCoords.findIndex((x) => x.r === r && x.c === c);
    if (existingIdx > -1) {
      const nextSel = [...selectedCoords];
      nextSel.splice(existingIdx, 1);
      setSelectedCoords(nextSel);
      const s = nextSel.reduce((acc, cc) => acc + (tileData[keyOf(cc.r, cc.c)] ?? 0), 0);
      setSum(s);
      return;
    }

    if (selectedCoords.length >= 2) return;

    const nextSel = [...selectedCoords, { r, c }];
    setSelectedCoords(nextSel);

    const currentSum = nextSel.reduce((acc, cc) => acc + (tileData[keyOf(cc.r, cc.c)] ?? 0), 0);
    setSum(currentSum);

    if (nextSel.length === 2) {
      const pairSnapshot: [Coord, Coord] = [{ ...nextSel[0] }, { ...nextSel[1] }];

      if (!checkAdjacent(pairSnapshot)) {
        showMessage("타일이 서로 붙어있어야 합니다!", "red");
        animateShake(pairSnapshot.map((p) => idOf(p.r, p.c)));
        setTimeout(() => resetSelection(nextSel), 600);
        return;
      }

      if (currentSum === 10) {
        burstTiles(pairSnapshot);
      } else if (currentSum > 10) {
        showMessage(`${currentSum} 초과! (합-10) 생성!`, "orange");
        animateShake(pairSnapshot.map((p) => idOf(p.r, p.c)));
        setTimeout(() => processOverTen(pairSnapshot), 600);
      } else {
        showMessage(`${currentSum} 미만! 숫자를 합칩니다.`, "blue");
        setTimeout(() => processUnderTen(pairSnapshot), 600);
      }
    } else {
      showMessage("이웃한 숫자를 선택하세요.", "blue");
    }
  }

  // --- Minimal self-tests (console only) ---
  useEffect(() => {
    try {
      console.assert(isValidCoord({ r: 0, c: 0 }) === true, "T1 isValidCoord failed");
      console.assert(isValidCoord({ r: 0 }) === false, "T2 isValidCoord should fail");
      console.assert(isValidPair([{ r: 0, c: 0 }, { r: 0, c: 1 }]) === true, "T3 isValidPair failed");
      console.assert(isValidPair([{ r: 0, c: 0 }]) === false, "T4 isValidPair should fail");
      console.assert(isValidPair([]) === false, "T5 isValidPair should fail");
      console.assert(checkAdjacent([{ r: 0, c: 0 }, { r: 0, c: 1 }]) === true, "T6 adjacency expected true");
    } catch (e) {
      console.error("Self-tests error:", e);
    }
  }, []);

  const msgColorStyle = useMemo(() => {
    switch (messageClass) {
      case "red":
        return styles.msgRed;
      case "orange":
        return styles.msgOrange;
      case "blue":
        return styles.msgBlue;
      case "green":
        return styles.msgGreen;
      case "purple":
        return styles.msgPurple;
      default:
        return styles.msgSlate;
    }
  }, [messageClass]);

  function isSelected(r: number, c: number) {
    return selectedCoords.some((x) => x.r === r && x.c === c);
  }

  function tileState(r: number, c: number) {
    const v = tileData[keyOf(r, c)];
    if (v === null) return "empty";
    return "active";
  }

  function tileFill(r: number, c: number) {
    const st = tileState(r, c);
    if (st === "empty") return COLOR_EMPTY;
    if (isSelected(r, c)) return "#3b82f6";
    return COLOR_TILE;
  }

  function tileTextColor(r: number, c: number) {
    const st = tileState(r, c);
    if (st === "empty") return "transparent";
    if (isSelected(r, c)) return "#ffffff";
    return "#1e293b";
  }

  function tileOpacity(r: number, c: number) {
    const st = tileState(r, c);
    return st === "empty" ? 0.5 : 1;
  }

  function tileShadow(r: number, c: number) {
    const st = tileState(r, c);
    const sel = isSelected(r, c);
    if (st === "empty") return null;

    if (sel) {
      return {
        shadowColor: "rgba(59, 130, 246, 1)",
        shadowOpacity: 0.6,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
        elevation: 10,
      };
    }
    return {
      shadowColor: "rgba(0,0,0,1)",
      shadowOpacity: 0.1,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    };
  }

  function tileScaleFactor(r: number, c: number) {
    const st = tileState(r, c);
    const sel = isSelected(r, c);
    if (st === "empty") return 1;
    if (sel) return 1.1;
    return 1;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.gameContainer}>
          {/* Start Overlay */}
          {startOverlayVisible && (
            <View style={styles.startOverlay}>
              <Pressable onPress={startGame} style={({ pressed }) => [styles.startBtn, pressed && styles.startBtnPressed]}>
                <Text style={styles.startBtnText}>시작하기</Text>
              </Pressable>
            </View>
          )}

          {/* Game Over Modal */}
          {gameOverVisible && (
            <View style={styles.gameOverModal}>
              <Text style={styles.gameOverTitle}>GAME OVER</Text>
              <Text style={styles.gameOverReason}>{gameOverReason}</Text>
              <Text style={styles.finalScore}>
                최종 점수: <Text style={styles.finalScoreNum}>{score}</Text>
              </Text>
              <Pressable onPress={initGame} style={({ pressed }) => [styles.retryBtn, pressed && styles.retryBtnPressed]}>
                <Text style={styles.retryBtnText}>다시 시도</Text>
              </Pressable>
            </View>
          )}

          {/* Score Board */}
          <View style={styles.scoreBoard}>
            <Text style={styles.title}>숫자 터트리기</Text>

            <View style={styles.topRow}>
              <Text style={styles.topRowText}>
                Lv.<Text style={styles.topRowText}>{level}</Text>
              </Text>
              <Text style={styles.topRowText}>
                Score: <Text style={styles.scoreBlue}>{score}</Text>
              </Text>
            </View>

            {/* Auto Spawn Gauge */}
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

          {/* Grid */}
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

                    const baseScale = tileScaleFactor(r, c);

                    const shadow = tileShadow(r, c);
                    const wrapperStyle = [
                      styles.hexWrapper,
                      { opacity: tileOpacity(r, c) },
                      shadow ?? null,
                    ];

                    return (
                      <View key={id} style={wrapperStyle}>
                        <Pressable
                          onPress={() => handleTilePress(r, c)}
                          disabled={st === "empty"}
                          style={styles.hexPress}
                        >
                          <Animated.View
                            style={{
                              transform: [
                                { translateX: a.tx },
                                { scale: Animated.multiply(a.scale, baseScale) },
                              ],
                              opacity: a.opacity,
                            }}
                          >
                            <Svg width={HEX_W} height={HEX_H} style={styles.hexSvg}>
                              <Polygon points={hexPoints} fill={tileFill(r, c)} />
                            </Svg>

                            <View style={styles.hexTextWrap}>
                              <Text
                                style={[
                                  styles.hexText,
                                  { color: tileTextColor(r, c) },
                                  sel ? styles.hexTextSelected : null,
                                ]}
                              >
                                {value === null ? "" : String(value)}
                              </Text>
                            </View>
                          </Animated.View>
                        </Pressable>
                      </View>
                    );
                  })}
                </View>
              );
            })}
          </View>

          {/* Footer hint */}
          <View style={styles.footerWrap}>
            <Text style={styles.footerPill}>
              10 완성 시 빈 타일 추가 생성 없음! 보드를 비워 공간을 확보하세요.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#e2e8f0" },
  body: {
    flex: 1,
    backgroundColor: "#e2e8f0",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gameContainer: {
    position: "relative",
    padding: 30,
    backgroundColor: "#ffffff",
    borderRadius: 32, // 2rem
    maxWidth: "95%",
    ...Platform.select({
      ios: {
        shadowColor: "rgba(0,0,0,1)",
        shadowOpacity: 0.25,
        shadowRadius: 25,
        shadowOffset: { width: 0, height: 12 },
      },
      android: {
        elevation: 10,
      },
      default: {},
    }),
  },

  // Start overlay
  startOverlay: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(255,255,255,0.9)",
    zIndex: 50,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  startBtn: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    backgroundColor: "#2563eb", // blue-600
    borderRadius: 24,
    transform: [{ scale: 1 }],
  },
  startBtnPressed: {
    backgroundColor: "#1d4ed8", // blue-700
    transform: [{ scale: 0.95 }],
  },
  startBtnText: {
    color: "#fff",
    fontSize: 24,
    fontWeight: "900",
    fontFamily: "Pretendard",
  },

  // Game over modal
  gameOverModal: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(255,255,255,0.95)",
    zIndex: 100,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center",
    paddingHorizontal: 20,
  },
  gameOverTitle: {
    fontSize: 36,
    fontWeight: "900",
    color: "#ef4444", // red-500
    marginBottom: 8,
    fontFamily: "Pretendard",
  },
  gameOverReason: {
    color: "#64748b", // slate-500
    fontWeight: "700",
    marginBottom: 24,
    fontFamily: "Pretendard",
  },
  finalScore: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 32,
    color: "#334155", // slate-700
    fontFamily: "Pretendard",
  },
  finalScoreNum: {
    fontWeight: "900",
    fontFamily: "Pretendard",
  },
  retryBtn: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: "#2563eb",
    borderRadius: 24,
    transform: [{ scale: 1 }],
  },
  retryBtnPressed: {
    backgroundColor: "#1d4ed8",
    transform: [{ scale: 0.95 }],
  },
  retryBtnText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "900",
    fontFamily: "Pretendard",
  },

  // Scoreboard
  scoreBoard: {
    alignItems: "center",
    marginBottom: 10,
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: "#1e293b", // slate-800
    marginBottom: 4,
    fontFamily: "Pretendard",
  },
  topRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    paddingHorizontal: 8,
  },
  topRowText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#64748b", // slate-500
    fontFamily: "Pretendard",
  },
  scoreBlue: {
    color: "#2563eb",
    fontWeight: "900",
    fontFamily: "Pretendard",
  },

  // Status
  statusContainer: {
    width: "100%",
    marginTop: 8,
    marginBottom: 0,
  },
  statusRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  statusLeft: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8", // slate-400
    textTransform: "uppercase",
    letterSpacing: -0.5,
    fontFamily: "Pretendard",
  },
  statusRight: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: -0.5,
    fontFamily: "Pretendard",
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    backgroundColor: "#e2e8f0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
  },

  // Sum
  sumRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    columnGap: 12,
    marginTop: 12,
  },
  sumDisplay: {
    color: "#f97316", // orange-500
    fontSize: 36,
    fontWeight: "900",
    fontFamily: "Pretendard",
  },
  sumDenom: {
    color: "#94a3b8",
    fontSize: 20,
    fontWeight: "700",
    fontFamily: "Pretendard",
  },

  // Message (height fixed 24px like HTML)
  message: {
    marginTop: 12,
    height: 24,
    fontSize: 14,
    fontWeight: "900",
    fontFamily: "Pretendard",
  },
  msgSlate: { color: "#64748b" },
  msgRed: { color: "#dc2626" },
  msgOrange: { color: "#f97316" },
  msgBlue: { color: "#3b82f6" },
  msgGreen: { color: "#16a34a" },
  msgPurple: { color: "#9333ea", transform: [{ scale: 1.1 }] },

  // Grid container
  gridContainer: {
    alignItems: "center",
    gap: 2 as any,
    marginTop: 10,
    padding: 25,
    backgroundColor: COLOR_BG_GRID,
    borderRadius: 24,
    overflow: "visible",
  },
  hexRow: {
    flexDirection: "row",
    justifyContent: "center",
    columnGap: HEX_GAP,
  },
  hexRowOverlap: {
    marginBottom: -20,
  },
  hexWrapper: {
    width: HEX_W,
    height: HEX_H,
  },
  hexPress: {
    width: HEX_W,
    height: HEX_H,
  },
  hexSvg: {
    width: HEX_W,
    height: HEX_H,
  },
  hexTextWrap: {
    position: "absolute",
    left: 0, top: 0, right: 0, bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  hexText: {
    fontSize: 26, // 1.6rem approx
    fontWeight: "900",
    fontFamily: "Pretendard",
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  hexTextSelected: {
    color: "#fff",
  },

  // Footer
  footerWrap: {
    marginTop: 32,
    alignItems: "center",
    gap: 16 as any,
  },
  footerPill: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "700",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    textAlign: "center",
    fontFamily: "Pretendard",
  },
});
