import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "HIGH_SCORE_V1";

export async function loadHighScore(): Promise<number> {
  const v = await AsyncStorage.getItem(KEY);
  const n = v ? Number(v) : 0;
  return Number.isFinite(n) ? n : 0;
}

export async function saveHighScoreIfGreater(score: number): Promise<boolean> {
  const cur = await loadHighScore();
  if (score > cur) {
    await AsyncStorage.setItem(KEY, String(score));
    return true;
  }
  return false;
}
