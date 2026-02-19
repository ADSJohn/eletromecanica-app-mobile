export const calculateRMS = (values: number[]) => {
  const square = values.map((v) => v * v);
  const mean = square.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(mean);
};

export const calculatePeak = (values: number[]) => {
  return Math.max(...values);
};

export const calculateHealth = (rms: number) => {
  if (rms < 0.5) return { status: "Excelente", color: "#00e676" };
  if (rms < 1.5) return { status: "Atenção", color: "#ff9800" };
  return { status: "Crítico", color: "#ff1744" };
};
