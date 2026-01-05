import { Stack } from "expo-router";
import AdBanner from "../AdMob/banner";

console.log("TABS LAYOUT LOADED");

export default function TabLayout() {
  return (
  <>
    <Stack screenOptions={{ headerShown: false }} />
    <AdBanner />
  </>);
}