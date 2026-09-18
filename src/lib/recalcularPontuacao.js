export const EQUIPE_EXCLUIDA_RECALC_ID = 'LhT2fV3JvyQhZU8PrSFl'

const PESOS_ANTIGOS_DISTINTOS = new Set([1, 4, 5])
const PESOS_NOVOS_DISTINTOS = new Set([2, 8, 10])

export function round2(n) {
  return Math.round(Number(n || 0) * 100) / 100
}

export function ehTarefa(respostaId, resposta) {
  if (resposta?.tipo === 'tarefa') return true
  const id = String(respostaId || '')
  return id === 'tarefa' || id.startsWith('tarefa_')
}

export function listarPesosAlternativas(questoesById) {
  const pesos = new Set()
  for (const q of Object.values(questoesById || {})) {
    for (const alt of q?.alternativas || []) {
      pesos.add(Number(alt?.peso) || 0)
    }
  }
  return [...pesos].sort((a, b) => a - b)
}

export function questoesAindaNaEscalaAntiga(questoesById) {
  const pesos = listarPesosAlternativas(questoesById)
  const temAntiga = pesos.some((p) => PESOS_ANTIGOS_DISTINTOS.has(p))
  const temNova = pesos.some((p) => PESOS_NOVOS_DISTINTOS.has(p))
  return temAntiga && !temNova
}

export function faseDaResposta(respostaId, resposta, questoesById) {
  if (resposta?.faseId) return String(resposta.faseId)
  const q = questoesById?.[respostaId]
  if (q?.faseId) return String(q.faseId)
  const id = String(respostaId || '')
  if (id.startsWith('tarefa_')) return id.slice('tarefa_'.length)
  return ''
}

export function pesoEntregue(respostaId, resposta, questoesById) {
  if (!resposta || resposta.status !== 'entregue') return 0
  if (ehTarefa(respostaId, resposta)) return Number(resposta.peso || 0)
  const q = questoesById?.[respostaId]
  const alt = (q?.alternativas || []).find((a) => a.letra === resposta.alternativa)
  if (alt && alt.peso != null && alt.peso !== '') return Number(alt.peso) || 0
  return Number(resposta.peso || 0)
}

function respostasMapa(equipe) {
  const r = equipe?.respostas
  if (!r || typeof r !== 'object' || Array.isArray(r)) return {}
  return r
}

export function calcularEquipe(equipe, fases, questoesById) {
  const respostas = respostasMapa(equipe)
  const pontuacoes = {}
  const respostasPeso = {}
  let df = 0
  let temEntregue = false

  for (const fase of fases || []) {
    let ni = 0
    for (const [rid, res] of Object.entries(respostas)) {
      if (!res || typeof res !== 'object' || Array.isArray(res)) continue
      if (res.status !== 'entregue') continue
      if (faseDaResposta(rid, res, questoesById) !== String(fase.id)) continue
      temEntregue = true
      const novoPeso = pesoEntregue(rid, res, questoesById)
      ni += novoPeso
      if (!ehTarefa(rid, res) && round2(res.peso || 0) !== round2(novoPeso)) {
        respostasPeso[rid] = novoPeso
      }
    }
    const di = round2(ni * (Number(fase.peso) || 0))
    pontuacoes[fase.id] = { ni: round2(ni), di }
    df = round2(df + di)
  }

  if (!temEntregue) {
    return {
      id: equipe.id,
      nome: equipe.nome || equipe.id,
      dfAntigo: round2(equipe.df || 0),
      dfNovo: round2(equipe.df || 0),
      pontuacoes: {},
      respostasPeso: {},
      mudou: false,
      writes: 0,
    }
  }

  let mudouPont = false
  for (const fase of fases || []) {
    const atual = equipe.pontuacoes?.[fase.id] || {}
    const novo = pontuacoes[fase.id]
    if (round2(atual.ni || 0) !== novo.ni || round2(atual.di || 0) !== novo.di) {
      mudouPont = true
    }
  }

  const dfAntigo = round2(equipe.df || 0)
  const mudou = mudouPont || dfAntigo !== df || Object.keys(respostasPeso).length > 0
  const writes = mudou
    ? 1 + (fases || []).length + Object.keys(respostasPeso).length
    : 0

  return {
    id: equipe.id,
    nome: equipe.nome || equipe.id,
    dfAntigo,
    dfNovo: df,
    pontuacoes,
    respostasPeso,
    mudou,
    writes,
  }
}

export function gerarPreviewRecalc(equipes, fases, questoesById) {
  if (!fases?.length) {
    return { erro: 'sem_fases', itens: [], alteradas: [], writesEstimados: 0 }
  }
  if (!Object.keys(questoesById || {}).length) {
    return { erro: 'sem_questoes', itens: [], alteradas: [], writesEstimados: 0 }
  }
  if (questoesAindaNaEscalaAntiga(questoesById)) {
    return {
      erro: 'questoes_antigas',
      pesos: listarPesosAlternativas(questoesById),
      itens: [],
      alteradas: [],
      writesEstimados: 0,
    }
  }

  const itens = (equipes || [])
    .filter((eq) => eq?.id && eq.id !== EQUIPE_EXCLUIDA_RECALC_ID)
    .map((eq) => calcularEquipe(eq, fases, questoesById))
  const alteradas = itens.filter((item) => item.mudou)
  const writesEstimados = alteradas.reduce((n, item) => n + (item.writes || 0), 0)
  return { erro: null, itens, alteradas, writesEstimados }
}

export function payloadGravacao(item, fases) {
  const update = { df: item.dfNovo }
  for (const fase of fases || []) {
    const p = item.pontuacoes?.[fase.id]
    if (!p) continue
    update[`pontuacoes.${fase.id}.ni`] = p.ni
    update[`pontuacoes.${fase.id}.di`] = p.di
  }
  for (const [rid, peso] of Object.entries(item.respostasPeso || {})) {
    update[`respostas.${rid}.peso`] = peso
  }
  return update
}
