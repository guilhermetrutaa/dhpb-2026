// Correção da tarefa Portfólio Artístico (fase 4): corretores, restrição de campus,
// distribuição determinística, 3ª correção e veredito.
// Fonte das regras: public/Explicacao-Sistema-Correcao.pdf + spec 044.
// Arquivo PURO (sem Firebase): o I/O vive em `correcao-firestore.js`.

import { EQUIPE_EXCLUIDA_RECALC_ID, round2 } from '@/lib/recalcularPontuacao'
import { respostaTarefaDaFase } from '@/lib/bonificarRecorte13'
import { ehPublica } from '@/lib/eliminacaoFases'

export const FASE_ALVO = 'fase4'
export const DIVULGACAO_20 = 20

/** Os 7 corretores. `campus` é o que eles NÃO podem corrigir. */
export const CORRETORES = [
  { id: 'glayds', nome: 'Glayds', campus: 'Campina Grande' },
  { id: 'leonardo', nome: 'Leonardo', campus: 'Picuí' },
  { id: 'maxsuel', nome: 'Maxsuel', campus: 'Monteiro' },
  { id: 'stenio', nome: 'Stênio', campus: 'João Pessoa' },
  { id: 'fabricio', nome: 'Fabrício', campus: 'João Pessoa' },
  { id: 'cristina', nome: 'Cristina', campus: 'João Pessoa' },
  { id: 'licio', nome: 'Lício', campus: 'Cabedelo' },
]

export const COLUNAS = [
  { id: 'pubMedio', titulo: 'Públicas (Médio)' },
  { id: 'pubFund', titulo: 'Públicas (Fundamental)' },
  { id: 'privMedio', titulo: 'Privadas (Médio)' },
  { id: 'privFund', titulo: 'Privadas (Fundamental)' },
  { id: 'corrigidas', titulo: 'Corrigidas' },
]

const COLUNA_POR_REDE_MODALIDADE = {
  publica_medio: 'pubMedio',
  publica_fundamental: 'pubFund',
  particular_medio: 'privMedio',
  particular_fundamental: 'privFund',
}

export const normalizar = (s) =>
  String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()

export const chaveRedeModalidade = (equipe) => {
  const rede = ehPublica(equipe?.tipoEscola) ? 'publica' : 'particular'
  const m = String(equipe?.modalidade || '').toLowerCase()
  const modalidade = m === 'medio' || m === 'eja_medio' ? 'medio' : 'fundamental'
  return `${rede}_${modalidade}`
}

/** Coluna fixa de um portfólio. `Corrigidas` é derivada do estado, não da rede. */
export function colunaDe(equipe) {
  return COLUNA_POR_REDE_MODALIDADE[chaveRedeModalidade(equipe)] || 'pubMedio'
}

/** Município da escola da equipe, via `public/escolas-pb.json` indexado por id (INEP). */
export function campusDaEquipe(equipe, escolasPorId) {
  const escola = escolasPorId?.[String(equipe?.escolaId ?? '')]
  const municipio = escola?.municipio || equipe?.campus
  return municipio ? normalizar(municipio) : ''
}

const ehDoCampus = (corretor, campus) => !!campus && normalizar(corretor.campus) === campus

/** Corretor de menor carga, respeitando campus e quem já corrigiu a equipe. */
function escolher(corretores, { campus = '', jaAtribuidos = [], carga = {} }) {
  const repetidos = new Set(jaAtribuidos)
  return corretores
    .filter((c) => !ehDoCampus(c, campus) && !repetidos.has(c.id))
    .sort((a, b) => (carga[a.id] || 0) - (carga[b.id] || 0))[0]
}

/**
 * Distribuição determinística: 2 corretores por portfólio, round-robin pela ordem de
 * carga. Mesma entrada → mesma saída. Sem `Math.random`, sem estado global.
 * `campusPorEquipe` = { [equipeId]: 'joao pessoa' } (já normalizado).
 */
export function distribuir(equipes, campusPorEquipe = {}) {
  const carga = {}
  for (const c of CORRETORES) carga[c.id] = 0
  const atribuido = {}

  const elegiveis = (equipes || [])
    .filter((e) => e?.id && e.id !== EQUIPE_EXCLUIDA_RECALC_ID)
    .filter((e) => respostaTarefaDaFase(e, FASE_ALVO)?.status === 'entregue')
    .slice()
    .sort((a, b) => String(a.nomeLower || a.nome || a.id).localeCompare(String(b.nomeLower || b.nome || b.id), 'pt-BR'))

  for (const equipe of elegiveis) {
    const campus = campusPorEquipe[equipe.id] || ''
    const ja = []
    for (let i = 0; i < 2; i++) {
      const escolhido = escolher(CORRETORES, { campus, jaAtribuidos: ja, carga })
      if (!escolhido) break
      ja.push(escolhido.id)
      carga[escolhido.id] = (carga[escolhido.id] || 0) + 1
    }
    atribuido[equipe.id] = ja
  }

  return { atribuido, carga, elegiveis: elegiveis.map((e) => e.id) }
}

/** 3ª correção quando as 2 notas divergem 20 ou mais. */
export function precisaTerceira(notas) {
  if (!Array.isArray(notas) || notas.length !== 2) return false
  return Math.abs(notas[0] - notas[1]) >= DIVULGACAO_20
}

/** Veredito: 2 notas → média. 3 notas → descarta a menor e mede as 2 maiores. */
export function notaFinal(notas) {
  const vals = (notas || []).map(Number).filter((n) => Number.isFinite(n)).sort((a, b) => a - b)
  if (vals.length === 0) return 0
  if (vals.length === 1) return round2(vals[0])
  if (vals.length === 2) return round2((vals[0] + vals[1]) / 2)
  const maiores = vals.slice(-2)
  return round2((maiores[0] + maiores[1]) / 2)
}

/** 3º corretor: elegível (fora do campus e fora dos 2 primeiros), menor carga. */
export function escolherTerceiro({ campus = '', jaAtribuidos = [], carga = {} }) {
  return escolher(CORRETORES, { campus, jaAtribuidos, carga })
}

// ---------------------------------------------------------------------------
// Gravação da nota no ranking
// ---------------------------------------------------------------------------

/**
 * Espalha a resposta preservando `portfolio`, `design`, `status`, `enigmas` etc.
 * Só troca `peso` e carimba a correção — o mapa embutido sobrescreve o objeto inteiro.
 */
export function montarRespostaCorrigida(atual, faseId, nota, autor) {
  return {
    ...(atual && typeof atual === 'object' && !Array.isArray(atual) ? atual : {}),
    status: atual?.status || 'entregue',
    peso: nota,
    faseId: atual?.faseId || faseId,
    tipo: 'tarefa',
    corrigidoEm: new Date().toISOString(),
    corrigidoPor: autor,
  }
}

/** Preview: o que muda se a nota for fechada. Sem I/O. */
export function previewNota(equipe, fase, nota, autor) {
  const resposta = respostaTarefaDaFase(equipe, fase?.id)
  const vazio = { id: equipe?.id, nome: equipe?.nome, mudou: false, delta: 0 }
  if (!equipe?.id || !fase?.id) return vazio
  if (!resposta || resposta.status !== 'entregue') return vazio
  if (equipe.id === EQUIPE_EXCLUIDA_RECALC_ID) return vazio

  const pesoAtual = round2(resposta.peso || 0)
  const delta = round2(nota - pesoAtual)
  if (delta === 0) return { ...vazio, delta: 0, pesoAtual, pesoNovo: nota }

  const deltaDi = round2(delta * (Number(fase.peso) || 0))
  return {
    ...vazio,
    mudou: true,
    delta,
    deltaDi,
    pesoAtual,
    pesoNovo: nota,
    dfAntigo: round2(equipe.df || 0),
    dfNovo: round2(Number(equipe.df || 0) + deltaDi),
    respostaCorrigida: montarRespostaCorrigida(resposta, fase.id, nota, autor),
  }
}

/**
 * Prepara a gravação do veredito a partir do doc da equipe já relido ao vivo.
 * Devolve `null` quando não há o que gravar (não entregue, ou nota igual à atual).
 * O caller aplica o resultado dentro da própria transação — ver `correcao-firestore.js`.
 */
export function prepararGravacao(equipe, fase, nota, autor) {
  const faseId = fase?.id
  const resposta = respostaTarefaDaFase(equipe, faseId)
  if (!resposta || resposta.status !== 'entregue') return null

  const pesoAtual = round2(resposta.peso || 0)
  const delta = round2(nota - pesoAtual)
  if (delta === 0) return null

  const pesoFase = Number(fase?.peso) || 0
  return {
    respostaId: `tarefa_${faseId}`,
    resposta: montarRespostaCorrigida(resposta, faseId, nota, autor),
    delta,
    deltaDi: round2(delta * pesoFase),
    atualizaLegado: String(resposta.faseId || faseId) === String(faseId),
  }
}

if (process.env.NODE_ENV !== 'production') {
  const eq = (id, nomeLower, tipoEscola, modalidade, status = 'entregue') => ({
    id,
    nome: nomeLower,
    nomeLower,
    tipoEscola,
    modalidade,
    respostas: { [`tarefa_${FASE_ALVO}`]: { status, faseId: FASE_ALVO, peso: 0 } },
  })

  // 1. campus: ninguém corrige o próprio campus
  const cp = { eq1: 'joao pessoa', eq2: 'campina grande', eq3: 'picoi' }
  const r = distribuir([eq('eq1', 'a', 'federal', 'medio'), eq('eq2', 'b', 'federal', 'fundamental'), eq('eq3', 'c', 'particular', 'medio')], cp)
  const par = Object.entries(r.atribuido)
  for (const [eid, lista] of par) {
    const proibidos = new Set(CORRETORES.filter((x) => ehDoCampus(x, cp[eid])).map((x) => x.id))
    for (const id of lista) {
      if (proibidos.has(id)) throw new Error(`${eid}: ${id} não pode corrigir o próprio campus ${cp[eid]}.`)
    }
    if (lista.length !== 2) throw new Error(`${eid}: tem de ter 2 corretores.`)
    if (lista[0] === lista[1]) throw new Error(`${eid}: os 2 corretores têm de ser diferentes.`)
  }
  const eq1 = r.atribuido.eq1
  if (eq1.includes('stenio') || eq1.includes('fabricio') || eq1.includes('cristina')) {
    throw new Error('João Pessoa tem de ficar fora dos 3 de JP.')
  }

  // 2. determinismo
  const again = distribuir([eq('eq1', 'a', 'federal', 'medio'), eq('eq2', 'b', 'federal', 'fundamental'), eq('eq3', 'c', 'particular', 'medio')], cp)
  if (JSON.stringify(again.atribuido) !== JSON.stringify(r.atribuido)) throw new Error('A distribuição tem de ser determinística.')

  // 3. 3ª correção
  if (!precisaTerceira([80, 55]) || !precisaTerceira([100, 80])) throw new Error('Divergência ≥ 20 tem de pedir 3ª correção.')
  if (precisaTerceira([80, 65]) || precisaTerceira([80])) throw new Error('Divergência < 20 não pede 3ª correção.')

  // 4. veredito
  if (notaFinal([80, 55]) !== 67.5) throw new Error('2 notas: média simples.')
  if (notaFinal([80, 55, 70]) !== 75) throw new Error('3 notas: descarta a menor (55) e mede 80+70 → 75.')
  if (notaFinal([90, 80, 85]) !== 87.5) throw new Error('3 notas: descarta 80, mede 90+85 → 87,5.')
  if (notaFinal([]) !== 0) throw new Error('Sem nota = 0.')

  // 5. 3º corretor não pode ser um dos 2 primeiros nem do campus
  const t = escolherTerceiro({ campus: 'joao pessoa', jaAtribuidos: ['maxsuel', 'licio'], carga: {} })
  if (['stenio', 'fabricio', 'cristina'].includes(t.id)) throw new Error('3º corretor não pode ser do campus da equipe.')
  if (['maxsuel', 'licio'].includes(t.id)) throw new Error('3º corretor não pode repetir um dos 2 primeiros.')

  // 6. coluna
  if (colunaDe({ tipoEscola: 'municipal', modalidade: 'medio' }) !== 'pubMedio') throw new Error('Municipal+medio = Pública Médio.')
  if (colunaDe({ tipoEscola: 'estadual', modalidade: 'eja_fundamental' }) !== 'pubFund') throw new Error('Estadual+EJA fundamental = Pública Fundamental.')
  if (colunaDe({ tipoEscola: 'particular', modalidade: 'medio' }) !== 'privMedio') throw new Error('Particular+medio = Privada Médio.')
  if (colunaDe({ tipoEscola: 'federal', modalidade: 'fundamental' }) !== 'pubFund') throw new Error('Federal+fundamental = Pública Fundamental.')

  // 7. rascunho não entra
  const rasc = distribuir([eq('eq1', 'a', 'federal', 'medio', 'rascunho')], {})
  if (Object.keys(rasc.atribuido).length !== 0) throw new Error('Rascunho não entra na distribuição.')

  // 8. equipe de teste fora
  const tst = distribuir([{ ...eq('eq1', 'a', 'federal', 'medio'), id: EQUIPE_EXCLUIDA_RECALC_ID }], {})
  if (Object.keys(tst.atribuido).length !== 0) throw new Error('Equipe de teste tem de ficar fora.')

  // 9. prepararGravação / idempotência
  const fase = { id: FASE_ALVO, peso: 4 }
  const equipe = eq('eq1', 'a', 'federal', 'medio')
  const g1 = prepararGravacao(equipe, fase, 75, 'admin')
  if (!g1 || g1.delta !== 75 || g1.deltaDi !== 300) throw new Error('Peso 0 → 75 a di 300.')
  if (g1.respostaId !== `tarefa_${FASE_ALVO}` || !g1.atualizaLegado) throw new Error('Tem de gravar o dual-write legado desta fase.')
  const jaCorrigida = { ...equipe, respostas: { [`tarefa_${FASE_ALVO}`]: { status: 'entregue', faseId: FASE_ALVO, peso: 75 } } }
  if (prepararGravacao(jaCorrigida, fase, 75, 'admin') !== null) throw new Error('Nota igual não grava (delta 0).')
  if (prepararGravacao(equipe, fase, 90, 'admin').deltaDi !== 360) throw new Error('Peso 0 → 90 a di 360.')
  if (prepararGravacao(eq('eq1', 'a', 'federal', 'medio', 'rascunho'), fase, 75, 'admin') !== null) {
    throw new Error('Rascunho não grava.')
  }

  // 10. montarResponse preserva o portfólio
  const resp = montarRespostaCorrigida({ status: 'entregue', faseId: FASE_ALVO, peso: 0, design: 'rosa', portfolio: { titulo: 'x' }, enigmas: { a: 1 } }, FASE_ALVO, 75, 'admin')
  if (resp.design !== 'rosa' || resp.portfolio.titulo !== 'x' || resp.enigmas.a !== 1) throw new Error('montar tem de preservar design/portfolio/enigmas.')

  // 11. o mapa `tarefa` de outra fase não é tocado
  const outraFase = { ...equipe, respostas: { [`tarefa_${FASE_ALVO}`]: { status: 'entregue', faseId: 'fase3', peso: 0 } } }
  if (prepararGravacao(outraFase, fase, 75, 'admin').atualizaLegado) throw new Error('Mapa legado de outra fase não pode ser sobrescrito.')
}