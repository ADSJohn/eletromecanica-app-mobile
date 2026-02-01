import { regressaoLinear } from "./regressaoLinear";

export function predicaoML(
  valores: number[],
  limiteCritico: number,
  intervaloMinutos = 10
) {
  const modelo = regressaoLinear(valores);
  if (!modelo) return null;

  const { a, b } = modelo;
  if (a <= 0) return null;

  const xAtual = valores.length - 1;
  const xCritico = (limiteCritico - b) / a;
  const tempoRestante = (xCritico - xAtual) * intervaloMinutos;

  return { tempoRestante, a, b };
}
