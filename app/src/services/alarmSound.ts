import { Audio } from "expo-av";

let sound: Audio.Sound | null = null;

export async function playAlarm(volume: number) {
  if (sound) return;

  sound = new Audio.Sound();
  await sound.loadAsync(require("../../assets/alarm.mp3"), { volume });

  await sound.playAsync();
}

export async function stopAlarm() {
  if (!sound) return;

  await sound.stopAsync();
  await sound.unloadAsync();
  sound = null;
}
