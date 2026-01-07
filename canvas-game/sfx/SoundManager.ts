import { Audio } from "expo-av";

type SfxKey = "SuccessPop";

class SoundManager {
  private static sounds: Partial<Record<SfxKey, Audio.Sound>> = {};
  private static loaded = false;

  static async init() {
    if (this.loaded) return;
    this.loaded = true;

    await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });

    await this.load("SuccessPop", require("./audio/SuccessPop.wav"));
  }

  private static async load(key: SfxKey, source: any) {
    const { sound } = await Audio.Sound.createAsync(source, { shouldPlay: false });
    this.sounds[key] = sound;
  }

  private static async play(key: SfxKey) {
    const s = this.sounds[key];
    if (!s) return;
    try {
      await s.setPositionAsync(0);
      await s.playAsync();
    } catch {}
  }

  static playSuccessPop() {
    this.play("SuccessPop");
  }

  static async unloadAll() {
    for (const s of Object.values(this.sounds)) await s?.unloadAsync();
    this.sounds = {};
    this.loaded = false;
  }
}

export default SoundManager;
