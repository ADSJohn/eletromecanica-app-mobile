export function regressaoLinear(valores: number[]) {
  const n = valores.length;
  if (n < 3) return null;

  let somaX = 0;
  let somaY = 0;
  let somaXY = 0;
  let somaX2 = 0;

  for (let i = 0; i < n; i++) {
    somaX += i;
    somaY += valores[i];
    somaXY += i * valores[i];
    somaX2 += i * i;
  }

  const a = (n * somaXY - somaX * somaY) / (n * somaX2 - somaX * somaX);

  const b = (somaY - a * somaX) / n;

  return { a, b };
}
