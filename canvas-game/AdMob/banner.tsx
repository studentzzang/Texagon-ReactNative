import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";

const PROD = (process.env.EXPO_PUBLIC_ADMOB_BANNER_UNIT_ID ?? "").trim();

export default function AdBanner() {
  const unitId = __DEV__ ? TestIds.BANNER : PROD;

  return (
    <BannerAd
      unitId={unitId}
      size={BannerAdSize.BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: true }}
    />
  );
}
