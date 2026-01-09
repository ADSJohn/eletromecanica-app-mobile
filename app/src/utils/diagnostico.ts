export function diagnostico(sensor: string, valor: number) {
  if (sensor.includes("Temperatura") && valor > 85)
    return "Possível sobrecarga ou falha de lubrificação";

  if (sensor.includes("Velocidade") && valor > 1650)
    return "Inversor ou controle fora do padrão";

  if (sensor.includes("Alinhamento") && valor > 2)
    return "Desalinhamento mecânico do eixo";

  return "Operação normal";
}
