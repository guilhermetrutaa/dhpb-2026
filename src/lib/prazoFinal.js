// Spec 055. Horário de Fortaleza (UTC−3, sem horário de verão).
// ponytail: o corte usa o relógio do aparelho. Quem mudar o relógio ainda consegue enviar. Trava firme seria regra do Firestore.

export const FIM_PRESENCA_MS = Date.parse('2026-11-11T23:59:00-03:00')
export const INICIO_TAMANHOS_MS = Date.parse('2026-11-12T00:00:00-03:00')

export function presencaAberta(agora = Date.now()) {
  return agora < FIM_PRESENCA_MS
}

export function tamanhosAbertos(agora = Date.now()) {
  return agora >= INICIO_TAMANHOS_MS
}
