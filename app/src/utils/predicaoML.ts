import { regressaoLinear } from "./regressaoLinear";

export function predicaoML(
  valores: number[],
  limiteCritico: number,
  intervaloMinutos = 10
) {
  const modelo = regressaoLinear(valores);
  if (!modelo) return null;

  const { a, b } = modelo;

  // tendência fraca
  if (a <= 0.1) {
    return {
      risco: "BAIXO",
      mensagem: "Tendência estável, sem risco imediato",
    };
  }

  // prever quando atinge limite crítico
  const xCritico = (limiteCritico - b) / a;
  const tempoRestante = (xCritico - (valores.length - 1)) * intervaloMinutos;

  if (tempoRestante <= 0) {
    return {
      risco: "CRÍTICO",
      mensagem: "Falha iminente detectada",
    };
  }

  if (tempoRestante < 60) {
    return {
      risco: "ALTO",
      mensagem: `Falha prevista em ~${Math.round(tempoRestante)} min`,
    };
  }

  return {
    risco: "MÉDIO",
    mensagem: `Possível falha em ~${Math.round(tempoRestante)} min`,
  };
}
