import { EQUIPE_EXCLUIDA_RECALC_ID, round2 } from '@/lib/recalcularPontuacao'
import {
  deveAtualizarLegadoTarefa,
  respostaTarefaDaFase,
} from '@/lib/bonificarRecorte13'

export const NOTA_FIXA_TAREFA_FASE3 = 20
export const WRITES_POR_EQUIPE_FASE3 = 3

export function tarefaUrlEhGaleria(tarefaUrl) {
  return String(tarefaUrl || '').toLowerCase().includes('galeria-de-enigmas')
}

/** 3ª fase na ordem já vinda de `orderBy('dataInicio')`. */
export function encontrarFase3Galeria(fases) {
  if (!Array.isArray(fases) || fases.length < 3 || !fases[2]?.id) {
    return { erro: 'sem_fase3', fase: null }
  }
  const fase = fases[2]
  if (!tarefaUrlEhGaleria(fase.tarefaUrl)) {
    return { erro: 'tarefa_nao_galeria', fase }
  }
  return { erro: null, fase }
}

export function itemNotaFixaFase3(equipe, fase) {
  const faseId = fase?.id
  const id = equipe?.id
  const nome = equipe?.nome || id
  const vazio = { id, nome, mudou: false, writes: 0 }
  if (!id || !faseId || id === EQUIPE_EXCLUIDA_RECALC_ID) return vazio

  const resposta = respostaTarefaDaFase(equipe, faseId)
  if (!resposta || resposta.status !== 'entregue') return vazio

  const pesoAtual = round2(resposta.peso || 0)
  const delta = round2(NOTA_FIXA_TAREFA_FASE3 - pesoAtual)
  if (delta === 0) return vazio

  const deltaDi = round2(delta * (Number(fase?.peso) || 0))
  return {
    id,
    nome,
    mudou: true,
    writes: WRITES_POR_EQUIPE_FASE3,
    faseId,
    respostaId: `tarefa_${faseId}`,
    delta,
    deltaDi,
    pesoAtual,
    pesoNovo: NOTA_FIXA_TAREFA_FASE3,
    dfAntigo: round2(equipe.df || 0),
    dfNovo: round2(Number(equipe.df || 0) + deltaDi),
    atualizarLegadoTarefa: deveAtualizarLegadoTarefa(equipe, faseId),
  }
}

/** Espalha a resposta atual: o mapa embutido substitui o objeto inteiro. */
export function montarRespostaNotaFixa(atual, faseId) {
  return {
    ...(atual && typeof atual === 'object' && !Array.isArray(atual) ? atual : {}),
    status: atual?.status || 'entregue',
    peso: NOTA_FIXA_TAREFA_FASE3,
    faseId: atual?.faseId || faseId,
    tipo: atual?.tipo || 'tarefa',
    atualizadoEm: new Date().toISOString(),
    atualizadoPor: 'admin',
  }
}

export function gerarPreviewNotaFixaFase3(equipes, fases) {
  const achou = encontrarFase3Galeria(fases)
  if (achou.erro) {
    return { erro: achou.erro, fase: achou.fase, itens: [], alteradas: [], writesEstimados: 0 }
  }
  const itens = (equipes || []).map((eq) => itemNotaFixaFase3(eq, achou.fase))
  const alteradas = itens.filter((item) => item.mudou)
  const writesEstimados = alteradas.reduce((n, item) => n + (item.writes || 0), 0)
  return { erro: null, fase: achou.fase, itens, alteradas, writesEstimados }
}

if (process.env.NODE_ENV !== 'production') {
  const fases = [
    { id: 'f1', tarefaUrl: '/tarefas/migalhas-flavio-tavares' },
    { id: 'f2', tarefaUrl: '/tarefas/viagem-no-tempo' },
    { id: 'f3', tarefaUrl: '/tarefas/galeria-de-enigmas', peso: 4 },
  ]
  const base = {
    id: 'eq1',
    nome: 'A',
    df: 10,
    membros: [{ id: 'so-um' }],
    respostas: {
      tarefa_f3: {
        status: 'entregue',
        peso: 11.5,
        enigmas: { e1: 1 },
        prateleiras: { 1: ['a'] },
        sorteio: [1],
      },
    },
  }
  const item = itemNotaFixaFase3(base, fases[2])
  if (item.delta !== 8.5 || item.pesoNovo !== 20 || item.deltaDi !== 34 || item.dfNovo !== 44) {
    throw new Error('entregue com peso 11,5 deve ir a 20 (delta 8,5, di 34)')
  }
  if (itemNotaFixaFase3({ ...base, respostas: { tarefa_f3: { status: 'entregue', peso: 20 } } }, fases[2]).mudou) {
    throw new Error('peso 20 não muda')
  }
  if (itemNotaFixaFase3({ ...base, respostas: { tarefa_f3: { status: 'rascunho', peso: 0 } } }, fases[2]).mudou) {
    throw new Error('rascunho não ganha 20')
  }
  if (itemNotaFixaFase3({ ...base, id: EQUIPE_EXCLUIDA_RECALC_ID }, fases[2]).mudou) {
    throw new Error('equipe de teste fora')
  }
  const obj = montarRespostaNotaFixa(base.respostas.tarefa_f3, 'f3')
  if (obj.peso !== 20 || obj.enigmas.e1 !== 1 || obj.prateleiras[1][0] !== 'a' || obj.sorteio[0] !== 1 || obj.status !== 'entregue') {
    throw new Error('montar deve manter enigmas, prateleiras, sorteio e entregue')
  }
  const preview = gerarPreviewNotaFixaFase3([base], fases)
  if (preview.erro || preview.alteradas.length !== 1) throw new Error('preview da galeria deve listar a equipe')
  if (gerarPreviewNotaFixaFase3([base], fases.slice(0, 2)).erro !== 'sem_fase3') {
    throw new Error('sem 3ª fase deve abortar')
  }
  if (gerarPreviewNotaFixaFase3([base], [...fases.slice(0, 2), { id: 'f3', tarefaUrl: '/tarefas/outra' }]).erro !== 'tarefa_nao_galeria') {
    throw new Error('3ª fase que não é a galeria deve abortar')
  }
}
