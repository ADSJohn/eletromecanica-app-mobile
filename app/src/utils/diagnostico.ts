export function diagnostico(tipo: string, rms: number) {
  if (tipo === "vib" && rms > 4.5)
    return "Vibração excessiva – possível falha em rolamento";

  if (tipo === "des" && rms > 3.0) return "Desbalanceamento do rotor";

  return "Normal";
}
