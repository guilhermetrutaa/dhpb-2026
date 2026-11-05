// Spec 050: decisão de encaminhamento das equipes após o encerramento da Fase 4.
// Função pura (sem Firestore/React) para ser testável e reutilizável na Sala de Equipe.

export const NIVEIS_APROVACAO = ['fase1', 'fase2', 'fase3', 'fase4', 'fase_final']

/**
 * Qual bloco a área vazia da Sala de Equipe deve mostrar.
 * @returns {'nenhum'|'finalista'|'nao-finalista'}
 */
export function decidirEncaminhamento({ fase4Status, aprovadoAte }) {
  if (fase4Status !== 'finalizada') return 'nenhum'
  if (aprovadoAte === 'fase_final') return 'finalista'
  return 'nao-finalista'
}

/**
 * Recorte das fases para o detalhamento de notas.
 * Finalista: todas as fases visíveis. Não-finalista: até a fase aprovada (inclusive).
 */
export function fasesDoDetalhamento(bloco, fases, aprovadoAte) {
  if (bloco === 'finalista') return fases
  const idx = NIVEIS_APROVACAO.indexOf(aprovadoAte || 'fase1')
  const ate = idx < 0 ? 1 : idx + 1
  return fases.slice(0, ate)
}
