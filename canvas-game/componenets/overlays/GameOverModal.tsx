import React, { useEffect, useMemo, useState } from "react";
import { View, Text, Pressable, Platform } from "react-native";
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
  AdEventType,
} from "react-native-google-mobile-ads";

export default function GameOverModal({
  gameOverReason,
  score,
  initGame,
  reviveGame,
  usedRevive,
  styles,
}: {
  gameOverReason: string;
  score: number;
  initGame: () => void;
  reviveGame: () => void;
  usedRevive?: boolean;
  styles: any;
}) {
  const PROD = (process.env.EXPO_PUBLIC_ADMOB_REWARD_UNIT_ID ?? "").trim();

  const adUnitId = useMemo(() => {
    // 개발 중엔 테스트 ID로 무조건 뜨게
    if (__DEV__) return TestIds.REWARDED;

    // PROD가 비어있으면(환경변수 실수) 크래시 방지용 fallback
    if (!PROD) return TestIds.REWARDED;

    return PROD;
  }, [PROD]);

  const rewarded = useMemo(
    () =>
      RewardedAd.createForAdRequest(adUnitId, {
        requestNonPersonalizedAdsOnly: true,
      }),
    [adUnitId]
  );

  const [rewardLoaded, setRewardLoaded] = useState(false);

  useEffect(() => {
    const unsubLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => setRewardLoaded(true)
    );

    const unsubEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => {
        if (usedRevive) return;
        // 광고 끝까지 보면 부활
        reviveGame();
      }
    );

    // ✅ 닫힘 이벤트는 RewardedAdEventType이 아니라 AdEventType.CLOSED
    const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      setRewardLoaded(false);
      rewarded.load(); // 다음 광고 미리 로드
    });

    rewarded.load();

    return () => {
      unsubLoaded();
      unsubEarned();
      unsubClosed();
    };
  }, [rewarded, reviveGame, usedRevive]);

  return (
    <View style={styles.gameOverModal}>
      <Text style={styles.gameOverTitle}>GAME OVER</Text>
      <Text style={styles.gameOverReason}>{gameOverReason}</Text>

      <Text style={styles.finalScore}>
        최종 점수: <Text style={styles.finalScoreNum}>{score}</Text>
      </Text>

      <View style={styles.btnGroup}>
        { /* 광고보고 다시하기 */}
        {usedRevive === false && (
          <Pressable
            disabled={!rewardLoaded}
            onPress={() => rewarded.show()}
            style={({ pressed }) => [
              styles.retryBtn,
              pressed && styles.retryBtnPressed,
              !rewardLoaded && { opacity: 0.5 },
            ]}
          >
            <Text style={styles.retryBtnText}>🎬 계속하기</Text>
          </Pressable>
        )}

        {/* 🔁 다시 시도 */}
        <Pressable
          onPress={initGame}
          style={({ pressed }) => [
            styles.retryBtn,

            { marginTop: 10, backgroundColor: "#9ca3af" }, 
            pressed && { opacity: 0.9 },
          ]}
        >
          <Text style={styles.retryBtnText}>다시 시도</Text>
        </Pressable>
      </View>
     
    </View>
  );
}
