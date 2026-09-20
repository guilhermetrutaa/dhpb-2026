import { GABARITO } from '@/app/tarefas/recortes-flavio-tavares/config'
import { EQUIPE_EXCLUIDA_RECALC_ID, round2 } from '@/lib/recalcularPontuacao'

export const WRITES_POR_EQUIPE_RECORTE13 = 3

export function equipeTemQuatroMembros(data) {
  const m = data?.membros
  if (!m) return false
  const lista = Array.isArray(m) ? m : Object.values(m)
  return lista.filter(Boolean).length >= 4
}

export function tarefaUrlEhRecortes(tarefaUrl) {
  const url = String(tarefaUrl || '').toLowerCase()
  return url.includes('recortes') || url.includes('migalhas')
}

export function encontrarFaseRecortes(fases) {
  return (fases || []).find((f) => tarefaUrlEhRecortes(f.tarefaUrl)) || null
}

export function respostaTarefaDaFase(equipe, faseId) {
  const r = equipe?.respostas
  if (!r || typeof r !== 'object' || Array.isArray(r)) return null
  const keyed = r[`tarefa_${faseId}`]
  if (keyed && typeof keyed === 'object' && !Array.isArray(keyed)) return keyed
  const legado = r.tarefa
  if (!legado || typeof legado !== 'object' || Array.isArray(legado)) return null
  if (!legado.faseId || String(legado.faseId) === String(faseId)) return legado
  return null
}

export function letraRecorte13(associacoes) {
  if (!associacoes || typeof associacoes !== 'object' || Array.isArray(associacoes)) return ''
  return String(associacoes['13'] ?? associacoes[13] ?? '')
}

export function jaAcertouRecorte13(resposta) {
  return letraRecorte13(resposta?.associacoes) === GABARITO[13]
}

export function jaBonificadoRecorte13(resposta) {
  return resposta?.recorte13Bonificado === true
}

export function deveAtualizarLegadoTarefa(equipe, faseId) {
  const legado = equipe?.respostas?.tarefa
  if (!legado || typeof legado !== 'object' || Array.isArray(legado)) return true
  if (!legado.faseId) return true
  return String(legado.faseId) === String(faseId)
}

export function deltaRecorte13(resposta, teto) {
  if (!resposta || resposta.status !== 'entregue') return 0
  if (jaBonificadoRecorte13(resposta) || jaAcertouRecorte13(resposta)) return 0
  const limite = Number(teto) > 0 ? Number(teto) : 20
  const pesoAtual = Number(resposta.peso || 0)
  return round2(Math.min(pesoAtual + 1, limite) - pesoAtual)
}

export function montarRespostaBonificada(atual, pesoNovo, faseId) {
  const obj = {
    status: atual?.status || 'entregue',
    peso: pesoNovo,
    faseId: atual?.faseId || faseId,
    tipo: atual?.tipo || 'tarefa',
    recorte13Bonificado: true,
    atualizadoEm: new Date().toISOString(),
    atualizadoPor: 'admin',
  }
  if (atual?.associacoes && typeof atual.associacoes === 'object' && !Array.isArray(atual.associacoes)) {
    obj.associacoes = atual.associacoes
  }
  return obj
}

export function itemBonificacao(equipe, fase) {
  const faseId = fase?.id
  const id = equipe?.id
  const nome = equipe?.nome || id
  const vazio = { id, nome, mudou: false, writes: 0 }
  if (!id || !faseId || id === EQUIPE_EXCLUIDA_RECALC_ID) return vazio
  if (!equipeTemQuatroMembros(equipe)) return vazio

  const resposta = respostaTarefaDaFase(equipe, faseId)
  const teto = Number(fase?.tarefa?.pontuacao) || 20
  const delta = deltaRecorte13(resposta, teto)
  if (delta === 0) return vazio

  const pesoFase = Number(fase?.peso) || 0
  const pesoAtual = Number(resposta.peso || 0)
  const pesoNovo = round2(pesoAtual + delta)
  const deltaDi = round2(delta * pesoFase)
  return {
    id,
    nome,
    mudou: true,
    writes: WRITES_POR_EQUIPE_RECORTE13,
    faseId,
    respostaId: `tarefa_${faseId}`,
    pesoAtual,
    pesoNovo,
    delta,
    deltaDi,
    dfAntigo: round2(equipe.df || 0),
    dfNovo: round2(Number(equipe.df || 0) + deltaDi),
    atualizarLegadoTarefa: deveAtualizarLegadoTarefa(equipe, faseId),
  }
}

export function gerarPreviewRecorte13(equipes, fases) {
  const fase = encontrarFaseRecortes(fases)
  if (!fase) {
    return { erro: 'sem_fase_recortes', fase: null, itens: [], alteradas: [], writesEstimados: 0 }
  }
  const itens = (equipes || []).map((eq) => itemBonificacao(eq, fase))
  const alteradas = itens.filter((item) => item.mudou)
  const writesEstimados = alteradas.reduce((n, item) => n + (item.writes || 0), 0)
  return { erro: null, fase, itens, alteradas, writesEstimados }
}
