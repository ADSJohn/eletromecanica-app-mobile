export function acaoRecomendada(status: string) {
  if (status === "CRÍTICO")
    return "Parar máquina imediatamente e acionar manutenção";

  if (status === "ALERTA")
    return "Monitorar continuamente e programar inspeção";

  return "Nenhuma ação necessária";
}
