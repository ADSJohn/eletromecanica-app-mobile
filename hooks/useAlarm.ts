import { useEffect, useRef, useState } from "react";
import { Audio } from "expo-av";

export function useAlarm(ativo: boolean) {
  const soundRef = useRef<Audio.Sound | null>(null);
  const [silenciado, setSilenciado] = useState(false);

  async function tocar() {
    if (soundRef.current || silenciado) return;

    const { sound } = await Audio.Sound.createAsync(
      require("../app/assets/alarm.mp3"),
      { isLooping: true }
    );

    soundRef.current = sound;
    await sound.playAsync();
  }

  async function parar() {
    if (soundRef.current) {
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
    }
  }

  useEffect(() => {
    if (ativo && !silenciado) tocar();
    else parar();

    return () => {
      parar();
    };
  }, [ativo, silenciado]);

  return {
    silenciar: () => setSilenciado(true),
  };
}
