import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

export async function gerarRelatorioPDF(sensores: any[]) {
  const html = `
  <html>
    <body style="font-family: Arial; padding: 20px;">
      <h1>📄 Relatório de Monitoramento Industrial</h1>
      <p><strong>Data:</strong> ${new Date().toLocaleString()}</p>
      <hr/>

      ${sensores
        .map(
          (s) => `
        <h3>${s.icone} ${s.nome}</h3>
        <p><strong>Valor atual:</strong> ${s.valor} ${s.unidade}</p>
        <p><strong>Status:</strong> ${s.status}</p>
        <p><strong>Diagnóstico:</strong> ${s.diagnostico}</p>
        <p><strong>Ação recomendada:</strong> ${s.acao}</p>
        <hr/>
      `
        )
        .join("")}
    </body>
  </html>
  `;

  const file = await Print.printToFileAsync({ html });

  await Sharing.shareAsync(file.uri);
}
