export function diagnoseFault(fft: number[], rpm: number) {
  const peak = Math.max(...fft);
  const index = fft.indexOf(peak);
  const freq = (index * rpm) / fft.length;

  if (freq < rpm * 0.6) {
    return {
      fault: "Desbalanceamento",
      confidence: 0.85,
    };
  }

  if (freq < rpm * 1.2) {
    return {
      fault: "Desalinhamento",
      confidence: 0.78,
    };
  }

  return {
    fault: "Folga mecânica",
    confidence: 0.72,
  };
}
