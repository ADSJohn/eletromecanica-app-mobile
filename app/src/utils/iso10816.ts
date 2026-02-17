export function classifyISO(rms: number) {
  if (rms < 1.8)
    return { zone: "A", color: "#22c55e", description: "Excelente" };

  if (rms < 4.5)
    return { zone: "B", color: "#eab308", description: "Aceitável" };

  if (rms < 7.1)
    return { zone: "C", color: "#f97316", description: "Insatisfatória" };

  return { zone: "D", color: "#ef4444", description: "Crítica" };
}
