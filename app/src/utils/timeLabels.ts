export function gerarTempo(index: number, total: number) {
  const minutos = (total - index - 1) * 10;
  return minutos === 0 ? "Agora" : `${minutos} min`;
}
