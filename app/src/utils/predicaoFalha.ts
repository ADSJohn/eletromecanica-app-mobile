export function preverFalha(valores: number[]) {
  if (valores.length < 3) return null;

  const tendencia = valores[valores.length - 1] - valores[valores.length - 3];

  if (tendencia > 8)
    return {
      risco: "ALTO",
      mensagem: "Falha provável nas próximas horas",
    };

  if (tendencia > 4)
    return {
      risco: "MÉDIO",
      mensagem: "Comportamento degradante detectado",
    };

  return null;
}
