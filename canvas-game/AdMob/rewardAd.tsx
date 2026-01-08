import { useEffect, useMemo, useState } from "react";
import {
  RewardedAd,
  RewardedAdEventType,
  TestIds,
  AdEventType, 
} from "react-native-google-mobile-ads";

const PROD = (process.env.EXPO_PUBLIC_ADMOB_REWARD_UNIT_ID ?? "").trim();

export function useRewardedAd(onReward: () => void) {
  const [loaded, setLoaded] = useState(false);

  const unitId = __DEV__ ? TestIds.REWARDED : PROD;

  const rewarded = useMemo(
    () =>
      RewardedAd.createForAdRequest(unitId, {
        requestNonPersonalizedAdsOnly: true,
      }),
    [unitId]
  );

  useEffect(() => {
    const unsubLoaded = rewarded.addAdEventListener(
      RewardedAdEventType.LOADED,
      () => setLoaded(true)
    );

    const unsubEarned = rewarded.addAdEventListener(
      RewardedAdEventType.EARNED_REWARD,
      () => onReward()
    );

    // "닫힘"은 RewardedAdEventType이 아니라 AdEventType
    const unsubClosed = rewarded.addAdEventListener(AdEventType.CLOSED, () => {
      setLoaded(false);
      rewarded.load(); // 다음 광고 미리 로드
    });

    rewarded.load();

    return () => {
      unsubLoaded();
      unsubEarned();
      unsubClosed();
    };
  }, [rewarded, onReward]);

  return {
    loaded,
    show: () => {
      if (loaded) rewarded.show();
    },
  };
}
