import { Audio } from "expo-av";

let sound: Audio.Sound | null = null;

export async function startAlarm(volume: number) {
  if (sound) return;

  sound = new Audio.Sound();
  await sound.loadAsync(require("../../assets/alarm.mp3"), {
    isLooping: true,
    volume,
  });

  await sound.playAsync();
}

export async function stopAlarm() {
  if (!sound) return;

  await sound.stopAsync();
  await sound.unloadAsync();
  sound = null;
}
