import { Stack } from "expo-router";

console.log("TABS LAYOUT LOADED");

export default function TabLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}