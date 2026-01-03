import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  calcLevel,
  calcSpawnInterval,
  BASE_SPAWN_MS,
} from "./constants/gameSpeed";
import {
  View,
  Platform,
  Text,
  SafeAreaView,
  Animated,
  Easing,
} from "react-native";

import styles from "./styles/appStyles";

import { ROW_COUNTS, HEX_W, HEX_H, HEX_GAP, COLOR_TILE, COLOR_EMPTY } from "./constants/game";
import type { Coord, TileMap, TileAnim } from "./types/game";
import {
  keyOf,
  idOf,
  isValidCoord,
  isValidPair,
  pointsForHex,
  checkAdjacent,
  checkGameOver,
} from "./utils/grid";

import StartOverlay from "./componenets/overlays/StartOverlay";
import GameOverModal from "./componenets/overlays/GameOverModal";
import ScoreBoard from "./componenets/hud/ScoreBoard";
import HexGrid from "./componenets/grid/HexGrid";
import { saveHighScoreIfGreater, loadHighScore } from "./utils/highScore";

export default function App() {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const level = calcLevel(score);
  const spawnInterval = calcSpawnInterval(level);


  

  const [selectedCoords, setSelectedCoords] = useState<Coord[]>([]);
  const [tileData, setTileData] = useState<TileMap>({});

  const [sum, setSum] = useState(0);
  const [message, setMessage] = useState("");
  const [messageClass, setMessageClass] =
    useState<"slate" | "red" | "orange" | "blue" | "green" | "purple">("slate");

  const [startOverlayVisible, setStartOverlayVisible] = useState(true);
  const [gameOverVisible, setGameOverVisible] = useState(false);
  const [gameOverReason, setGameOverReason] = useState("더 이상 연결할 수 있는 이웃 타일이 없습니다!");

  const [spawnProgress, setSpawnProgress] = useState(0); // 0..100
  const [spawnSpeedText, setSpawnSpeedText] = useState("Normal");

  const rafIdRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);

  const hexPoints = useMemo(() => pointsForHex(HEX_W, HEX_H), []);

  const animsRef = useRef<Record<string, TileAnim>>({});
  const [burstIds, setBurstIds] = useState<Record<string, true>>({});
  const [penaltyIds, setPenaltyIds] = useState<Record<string, true>>({});

  const highWobble = useRef(new Animated.Value(0)).current;

  const scoreRef = useRef<number>(0);
  const spawnIntervalRef = useRef<number>(BASE_SPAWN_MS);

  useEffect(() => {
    (async () => {
        const hs = await loadHighScore();
        setHighScore(hs);
    })();
    }, []);


    useEffect(() => {
      scoreRef.current = score;

      const lv = calcLevel(score);
      const ms = calcSpawnInterval(lv);

      spawnIntervalRef.current = ms;
      updateSpawnSpeedText(lv);
    }, [score]);


  useEffect(() => {
    setHighScore((hs) => {
        if (score > hs) {
        playHighWobble();   
        saveHighScoreIfGreater(score);
        return score;
        }
        return hs; });
    }, [score]);


  function ensureAnim(id: string) {
    if (!animsRef.current[id]) {
      animsRef.current[id] = {
        scale: new Animated.Value(1),
        selScale: new Animated.Value(1),
        opacity: new Animated.Value(1),
        tx: new Animated.Value(0),
      };
    }
    return animsRef.current[id];
  }

  function animateSelectIn(id: string) {
    const a = ensureAnim(id);
    a.selScale.stopAnimation();
    Animated.timing(a.selScale, {
      toValue: 1.08,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  function animateSelectOut(id: string) {
    const a = ensureAnim(id);
    a.selScale.stopAnimation();
    Animated.timing(a.selScale, {
      toValue: 1,
      duration: 150,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }

  const useNative = Platform.OS !== "web";

    function playHighWobble() {
    highWobble.stopAnimation();
    highWobble.setValue(0);

    Animated.sequence([
        Animated.timing(highWobble, { toValue: -0.7, duration: 80, useNativeDriver: useNative }),
        Animated.timing(highWobble, { toValue:  0.7, duration: 140, useNativeDriver: useNative }),
        Animated.timing(highWobble, { toValue:  0,   duration: 80, useNativeDriver: useNative }),
        ]).start();
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

  async function triggerGameOver() {
        if (rafIdRef.current != null) cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;

        await saveHighScoreIfGreater(highScore); // ✅ 실시간 highScore를 저장
        setGameOverVisible(true);
    }



  function checkBoardStatus(nextMap: TileMap) {
    if (checkGameOver(nextMap)) {
      setGameOverReason("더 이상 연결할 수 있는 이웃 타일이 없습니다!");
      triggerGameOver();
    }
  }


  function clearSelectionWithAnim(coords: Coord[]) {
    coords.forEach((c) => animateSelectOut(idOf(c.r, c.c)));
    setSelectedCoords([]);
    setSum(0);
  }

  function resetSelection(curSelected: Coord[]) {
    curSelected.forEach((coord) => {
      const id = idOf(coord.r, coord.c);
      const a = ensureAnim(id);
      a.tx.setValue(0);
      animateSelectOut(id);
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
    setBurstIds((prev) => {
      const next = { ...prev };
      ids.forEach((id) => (next[id] = true));
      return next;
    });

    ids.forEach((id) => {
      const a = ensureAnim(id);

      a.scale.stopAnimation();
      a.opacity.stopAnimation();

      // keyframes 0%: scale(1.1), opacity 1
      a.scale.setValue(1.1);
      a.opacity.setValue(1);

      // keyframes 40%: scale(1.5), opacity 0.8
      Animated.parallel([
        Animated.timing(a.scale, {
          toValue: 1.5,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(a.opacity, {
          toValue: 0.8,
          duration: 200,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => {
        // keyframes 100%: scale(0), opacity 0
        Animated.parallel([
          Animated.timing(a.scale, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(a.opacity, {
            toValue: 0,
            duration: 300,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start(() => {
          a.scale.setValue(1);
          a.opacity.setValue(1);

          setBurstIds((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
        });
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

  function burstTiles(pairSnapshot: [Coord, Coord]) {
    if (!isValidPair(pairSnapshot)) return;

    // 선택 유지 스케일 끄기 (HTML처럼 burst가 우선)
    clearSelectionWithAnim(pairSnapshot);

    const ids = pairSnapshot.map((c) => idOf(c.r, c.c));
    animateBurst(ids);

    const nextScore = score + 20;
    setScore(nextScore);
    const level = calcLevel(score);

    showMessage("GREAT! 10 성공!", "green");

    setTimeout(() => {
      setTileData((prev) => {
        const next = { ...prev };
        pairSnapshot.forEach((c) => {
          next[keyOf(c.r, c.c)] = null;
        });
        setTimeout(() => checkBoardStatus(next), 0);
        return next;
      });
    }, 500);
  }

  function processOverTen(pairSnapshot: [Coord, Coord]) {
    if (!isValidPair(pairSnapshot)) return;

    clearSelectionWithAnim(pairSnapshot);

    setTileData((prev) => {
      const src = pairSnapshot[0];
      const dst = pairSnapshot[1];

      const v1 = prev[keyOf(src.r, src.c)] ?? 0;
      const v2 = prev[keyOf(dst.r, dst.c)] ?? 0;
      const remainder = v1 + v2 - 10;

      const next: TileMap = { ...prev };
      next[keyOf(src.r, src.c)] = null;
      next[keyOf(dst.r, dst.c)] = remainder;

      animatePulse(idOf(dst.r, dst.c));
      return next;
    });

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

    clearSelectionWithAnim(pairSnapshot);

    setTileData((prev) => {
      const v1 = prev[keyOf(pairSnapshot[0].r, pairSnapshot[0].c)] ?? 0;
      const v2 = prev[keyOf(pairSnapshot[1].r, pairSnapshot[1].c)] ?? 0;
      const newValue = v1 + v2;

      const next: TileMap = { ...prev };
      next[keyOf(pairSnapshot[0].r, pairSnapshot[0].c)] = null;
      next[keyOf(pairSnapshot[1].r, pairSnapshot[1].c)] = newValue;

      animatePulse(idOf(pairSnapshot[1].r, pairSnapshot[1].c));
      return next;
    });

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
    setSpawnProgress(0);
    updateSpawnSpeedText(1);

    setSelectedCoords([]);
    setSum(0);
    showMessage("게임을 시작합니다!", "slate");

    const base: TileMap = {};
    ROW_COUNTS.forEach((count, r) => {
      for (let c = 0; c < count; c++) {
        base[keyOf(r, c)] = null;
        const id = idOf(r, c);
        const a = ensureAnim(id);
        a.scale.setValue(1);
        a.selScale.setValue(1);
        a.opacity.setValue(1);
        a.tx.setValue(0);
      }
    });

    setTileData(base);

    setTimeout(() => spawnNumbers(8), 0);

    lastTsRef.current = (global as any)?.performance?.now?.() ?? Date.now();
    const loop = (ts: number) => {
      if (gameOverVisible) return;

      const last = lastTsRef.current;
      const delta = ts - last;
      lastTsRef.current = ts;

      const speed = spawnIntervalRef.current;
      setSpawnProgress((p) => {
        let next = p + (delta / speed) * 100;

        if (next >= 100) {
          next = 0;

          setTileData((prev) => {
            const emptyCount = Object.values(prev).filter((v) => v === null).length;
            if (emptyCount > 0) {
              const emptyKeys = Object.keys(prev).filter((k) => prev[k] === null);
              const shuffled = [...emptyKeys].sort(() => 0.5 - Math.random());
              const pick = shuffled[0];
              const [r, c] = pick.split(",").map(Number);
              const val = Math.floor(Math.random() * 9) + 1;

              const nextMap: TileMap = { ...prev, [pick]: val };
              animatePop(idOf(r, c));
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

    const id = idOf(r, c);

    const existingIdx = selectedCoords.findIndex((x) => x.r === r && x.c === c);
    if (existingIdx > -1) {

      animateSelectOut(id);

      const nextSel = [...selectedCoords];
      nextSel.splice(existingIdx, 1);
      setSelectedCoords(nextSel);

      const s = nextSel.reduce((acc, cc) => acc + (tileData[keyOf(cc.r, cc.c)] ?? 0), 0);
      setSum(s);
      return;
    }

    if (selectedCoords.length >= 2) return;

    animateSelectIn(id);

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

        const ids = pairSnapshot.map((p) => idOf(p.r, p.c));
        setPenaltyIds((prev) => {
          const next = { ...prev };
          ids.forEach((id) => (next[id] = true));
          return next;
        });

        animateShake(ids);

        setTimeout(() => {
          setPenaltyIds((prev) => {
            const next = { ...prev };
            ids.forEach((id) => delete next[id]);
            return next;
          });
          processOverTen(pairSnapshot);
        }, 600);

        return;
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

  function tileOpacity(r: number, c: number) {
    const st = tileState(r, c);
    return st === "empty" ? 0.5 : 1;
  }

  function tileScaleFactor() {
    return 1;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.body}>
        <View style={styles.gameContainer}>
          {startOverlayVisible && (
            <StartOverlay startGame={startGame} styles={styles} />
          )}

          {gameOverVisible && (
            <GameOverModal gameOverReason={gameOverReason} score={score} initGame={initGame} styles={styles} />
          )}

          <ScoreBoard
            level={level}
            score={score}
            highScore={highScore} 
            highWobble={highWobble}
            spawnSpeedText={spawnSpeedText}
            spawnProgress={spawnProgress}
            sum={sum}
            message={message}
            msgColorStyle={msgColorStyle}
            styles={styles}
          />

          <HexGrid
            ROW_COUNTS={ROW_COUNTS}
            HEX_W={HEX_W}
            HEX_H={HEX_H}
            HEX_GAP={HEX_GAP}
            hexPoints={hexPoints}
            ensureAnim={ensureAnim}
            tileData={tileData}
            tileState={tileState}
            isSelected={isSelected}
            tileFill={tileFill}
            tileOpacity={tileOpacity}
            tileScaleFactor={tileScaleFactor}
            penaltyIds={penaltyIds}
            burstIds={burstIds}
            handleTilePress={handleTilePress}
            styles={styles}
          />

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
