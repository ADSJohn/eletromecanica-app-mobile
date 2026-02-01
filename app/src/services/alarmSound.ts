import { Audio } from "expo-av";
import { Vibration } from "react-native";

let sound: Audio.Sound | null = null;
let vibInterval: any = null;

export async function startAlarm() {
  if (sound) return;

  sound = new Audio.Sound();
  await sound.loadAsync(require("../../assets/alarm.mp3"), {
    isLooping: true,
    volume: 1,
  });

  await sound.playAsync();

  vibInterval = setInterval(() => {
    Vibration.vibrate(1000);
  }, 1500);
}

export async function stopAlarm() {
  if (sound) {
    await sound.stopAsync();
    await sound.unloadAsync();
    sound = null;
  }

  if (vibInterval) {
    clearInterval(vibInterval);
    vibInterval = null;
  }

  Vibration.cancel();
}
