import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { classifyISO } from "../utils/iso10816";

export async function generateTechnicalReport({
  equipment,
  rpm,
  fft,
  diagnosis,
}: any) {
  const rms = Math.sqrt(
    fft.reduce((s: number, v: number) => s + v * v, 0) / fft.length,
  );

  const iso = classifyISO(rms);

  const html = `
  <html>
    <body style="font-family: Arial; padding: 32px;">
      <h1>Laudo Técnico de Vibração</h1>

      <h3>Identificação do Ativo</h3>
      <p><b>Equipamento:</b> ${equipment}</p>
      <p><b>Rotação:</b> ${rpm} RPM</p>
      <p><b>Data:</b> ${new Date().toLocaleString()}</p>

      <hr/>

      <h3>Resumo Executivo</h3>
      <p>
        Classificação ISO 10816:
        <b style="color:${iso.color}">
          Zona ${iso.zone} – ${iso.description}
        </b>
      </p>

      <h3>Análise de Vibração</h3>
      <ul>
        <li>Valor RMS: ${rms.toFixed(2)} mm/s</li>
        <li>Pico FFT: ${Math.max(...fft).toFixed(2)}</li>
      </ul>

      <h3>Diagnóstico Automático</h3>
      <p>
        Falha provável: <b>${diagnosis.fault}</b><br/>
        Confiabilidade: ${(diagnosis.confidence * 100).toFixed(0)}%
      </p>

      <h3>Recomendação Técnica</h3>
      <p>
        ${
          iso.zone === "A"
            ? "Operação normal."
            : iso.zone === "B"
              ? "Monitorar tendência."
              : iso.zone === "C"
                ? "Planejar manutenção."
                : "Parada imediata recomendada."
        }
      </p>

      <hr/>
      <small>
        Relatório gerado automaticamente por sistema de manutenção preditiva.
      </small>
    </body>
  </html>
  `;

  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri);
}
