import { Stack } from "expo-router";
import Head from "expo-router/head";

console.log("TABS LAYOUT LOADED");

export default function TabLayout() {
  return (
    <>
      <Head>
        <meta name="google-adsense-account" content="ca-pub-9617795046773959"  />

        <link rel="preconnect" href="https://fonts.googleapis.com"/>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/>
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital@0;1&family=Open+Sans:ital,wght@0,300..800;1,300..800&display=swap" rel="stylesheet"/>
      </Head>

      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
