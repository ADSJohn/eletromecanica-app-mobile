export function diagnostico(sensor: string, valor: number) {
  if (sensor === "Temperatura" && valor > 85)
    return "Possível falta de lubrificação ou sobrecarga";

  if (sensor === "Velocidade" && valor > 1650)
    return "Inversor desregulado ou falha no controle";

  if (sensor === "Alinhamento" && valor > 2)
    return "Desalinhamento mecânico do eixo";

  return "Operação normal";
}
