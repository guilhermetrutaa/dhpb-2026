// Spec 055. Quem sai da final e quem sobe da fase 4 até fechar as vagas.
import { compareRanking } from './eliminacaoFases.js'

export const VAGAS_FINAL = 121

export function planejarConvocacao(equipes, faseIds, vagas = VAGAS_FINAL) {
  const lista = equipes || []
  const finalistas = lista.filter((eq) => eq.aprovadoAte === 'fase_final')
  const ficam = finalistas.filter((eq) => eq.presencaFinalConfirmada)
  const saem = finalistas.filter((eq) => !eq.presencaFinalConfirmada)
  const faltam = Math.max(0, vagas - ficam.length)
  const sobem = lista
    .filter((eq) => eq.aprovadoAte === 'fase4')
    .sort((a, b) => compareRanking(a, b, faseIds))
    .slice(0, faltam)
  return { ficam, saem, sobem, faltam, vagas }
}
