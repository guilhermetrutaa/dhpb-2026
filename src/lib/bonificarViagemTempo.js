import { FOTOS, pontosAno, pontosLocal } from '@/app/tarefas/viagem-no-tempo/config'
import { EQUIPE_EXCLUIDA_RECALC_ID, round2 } from '@/lib/recalcularPontuacao'
import {
  deveAtualizarLegadoTarefa,
  equipeTemQuatroMembros,
  respostaTarefaDaFase,
} from '@/lib/bonificarRecorte13'

export const WRITES_POR_EQUIPE_VIAGEM = 3
export const PONTOS_ITEM = 1

/** Gabarito que saiu errado: o ano da imagem 2 e o local da imagem 7. Não corrigir aqui. */
const FOTO_ANO_IMG2 = FOTOS.find((f) => f.id === 2) || null
const FOTO_LOCAL_IMG7 = FOTOS.find((f) => f.id === 7) || null

export function tarefaUrlEhViagemTempo(tarefaUrl) {
  return String(tarefaUrl || '').toLowerCase().includes('viagem-no-tempo')
}

export function encontrarFaseViagemTempo(fases) {
  return (fases || []).find((f) => tarefaUrlEhViagemTempo(f.tarefaUrl)) || null
}

function zerouAno(imagem) {
  if (!imagem || imagem.ano == null || !FOTO_ANO_IMG2) return false
  return pontosAno(imagem.ano, FOTO_ANO_IMG2) === 0
}

function zerouLocal(imagem) {
  if (!imagem || imagem.lat == null || imagem.lng == null || !FOTO_LOCAL_IMG7) return false
  return pontosLocal(imagem.lat, imagem.lng, FOTO_LOCAL_IMG7) === 0
}

/** Crédito por item: 1,00 se o componente quebrado valeu 0,00. Ignora quem já foi bonificado. */
export function creditosDaResposta(resposta) {
  if (!resposta || resposta.status !== 'entregue') return { img2: 0, img7: 0 }
  const imagens = resposta.imagens
  return {
    img2: resposta.imagem2AnoBonificado === true || !zerouAno(imagens?.['2']) ? 0 : PONTOS_ITEM,
    img7: resposta.imagem7LocalBonificado === true || !zerouLocal(imagens?.['7']) ? 0 : PONTOS_ITEM,
  }
}

export function flagsDoItem(item) {
  const flags = {}
  if (item?.img2) flags.imagem2AnoBonificado = true
  if (item?.img7) flags.imagem7LocalBonificado = true
  return flags
}

export function itemBonificacaoViagemTempo(equipe, fase) {
  const faseId = fase?.id
  const id = equipe?.id
  const nome = equipe?.nome || id
  const vazio = { id, nome, mudou: false, writes: 0 }
  if (!id || !faseId || id === EQUIPE_EXCLUIDA_RECALC_ID) return vazio
  if (!equipeTemQuatroMembros(equipe)) return vazio

  const resposta = respostaTarefaDaFase(equipe, faseId)
  const { img2, img7 } = creditosDaResposta(resposta)
  const bruto = img2 + img7
  if (bruto === 0) return vazio

  const limite = Number(fase?.tarefa?.pontuacao) > 0 ? Number(fase.tarefa.pontuacao) : 20
  const pesoAtual = Number(resposta.peso || 0)
  const delta = round2(Math.min(pesoAtual + bruto, limite) - pesoAtual)
  // Teto não absorve o crédito inteiro: não credita e não marca flag (idempotência).
  if (delta < bruto) return vazio

  const deltaDi = round2(delta * (Number(fase?.peso) || 0))
  return {
    id,
    nome,
    mudou: true,
    writes: WRITES_POR_EQUIPE_VIAGEM,
    faseId,
    respostaId: `tarefa_${faseId}`,
    img2,
    img7,
    delta,
    deltaDi,
    pesoAtual,
    pesoNovo: round2(pesoAtual + delta),
    dfAntigo: round2(equipe.df || 0),
    dfNovo: round2(Number(equipe.df || 0) + deltaDi),
    atualizarLegadoTarefa: deveAtualizarLegadoTarefa(equipe, faseId),
  }
}

export function montarRespostaBonificadaViagemTempo(atual, pesoNovo, faseId, flags) {
  const obj = {
    status: atual?.status || 'entregue',
    peso: pesoNovo,
    faseId: atual?.faseId || faseId,
    tipo: atual?.tipo || 'tarefa',
    ...flags,
    atualizadoEm: new Date().toISOString(),
    atualizadoPor: 'admin',
  }
  if (atual?.imagens && typeof atual.imagens === 'object' && !Array.isArray(atual.imagens)) {
    obj.imagens = atual.imagens
  }
  return obj
}

export function gerarPreviewViagemTempo(equipes, fases) {
  const fase = encontrarFaseViagemTempo(fases)
  if (!fase) {
    return { erro: 'sem_fase_viagem', fase: null, itens: [], alteradas: [], writesEstimados: 0 }
  }
  const itens = (equipes || []).map((eq) => itemBonificacaoViagemTempo(eq, fase))
  const alteradas = itens.filter((item) => item.mudou)
  const writesEstimados = alteradas.reduce((n, item) => n + (item.writes || 0), 0)
  return { erro: null, fase, itens, alteradas, writesEstimados }
}
