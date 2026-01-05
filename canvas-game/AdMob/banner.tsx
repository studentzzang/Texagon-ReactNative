import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

export default function AdBanner() {
  return (
    <BannerAd
      unitId={__DEV__ ? TestIds.BANNER : process.env.ADMOB_KEY!}
      size={BannerAdSize.BANNER}
      requestOptions={{
        requestNonPersonalizedAdsOnly: true,
      }}
    />
  );
}