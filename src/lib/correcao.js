// Correção da tarefa Portfólio Artístico (fase 4): corretores, restrição de campus,
// distribuição determinística, 3ª correção e veredito.
// Fonte das regras: public/Explicacao-Sistema-Correcao.pdf + spec 044.
// Arquivo PURO (sem Firebase): o I/O vive em `correcao-firestore.js`.

import { EQUIPE_EXCLUIDA_RECALC_ID, round2 } from '@/lib/recalcularPontuacao'
import { respostaTarefaDaFase } from '@/lib/bonificarRecorte13'
import { ehPublica } from '@/lib/eliminacaoFases'

export const FASE_ALVO = 'fase4'
export const DIVULGACAO_20 = 20

// Caminhos da coleção nova, como array de segmentos — para o check validar a
// paridade que o Firestore exige (doc = par, coleção = ímpar).
export const CAMINHOS = {
  distribuicao: () => ['correcoes', FASE_ALVO, 'distribuicao', 'atual'],
  correcoes: (equipeId) => ['correcoes', FASE_ALVO, 'correcoes', equipeId],
  vereditos: (equipeId) => ['correcoes', FASE_ALVO, 'vereditos', equipeId],
  colecaoCorrecoes: () => ['correcoes', FASE_ALVO, 'correcoes'],
}

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

/**
 * Traduz o erro do Firestore numa frase que diz o que fazer.
 * Sem isto todo erro virava "Não foi possível carregar a fila" e o
 * diagnóstico levava meio dia (foi o que escondeu o `permission-denied`
 * das regras de `correcoes/**`).
 */
export function explicarErro(err) {
  const codigo = String(err?.code || '').replace(/^firestore\//, '')
  const mapa = {
    'permission-denied': 'Seu acesso não foi liberado para ver a fila. Fale com o admin para checar as regras do Firestore em `correcoes/**`.',
    unavailable: 'Sem conexão com o banco. Verifique a internet e recarregue.',
    'deadline-exceeded': 'O banco demorou demais para responder. Tente novamente.',
    'failed-precondition': 'Falta um índice no Firestore. O console mostra o link para criá-lo.',
    'not-found': 'A distribuição ainda não foi gerada. Peça ao admin para gerá-la.',
    unauthenticated: 'Sua sessão expirou. Saia e entre de novo.',
    'resource-exhausted': 'Muitas requisições. Aguarde alguns instantes.',
  }
  return mapa[codigo] || `Não foi possível carregar a fila (${codigo || 'erro desconhecido'}).`
}

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
    .replace(/[^a-zA-Z0-9\s]/g, ' ')
    .trim()
    .toLowerCase()

/**
 * Casa o nome do cadastro com um dos 7 corretores.
 * Aceita o nome permitido em QUALQUER posição: "José Maxsuel Lourenço Alves" é o
 * Maxsuel, e não por isso deixa de valer. O casamento é por palavra inteira, então
 * "Maxsuelson" não engana. Dois nomes da lista no mesmo cadastro é ambíguo: null.
 */
export function identificarCorretor(nomeCompleto, email) {
  const texto = normalizar(nomeCompleto || email)
  if (!texto) return null
  const palavras = new Set(texto.split(/\s+/).filter(Boolean))

  const achados = CORRETORES.filter((c) => {
    const alvo = normalizar(c.nome)
    return palavras.has(alvo) || texto.split(/\s+/).includes(alvo)
  })

  return achados.length === 1 ? achados[0] : null
}

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

/** `public/escolas-pb.json` indexado por `escolaId` (INEP). Fonte única do campus. */
export function indiceEscolasPorId(escolas) {
  return Object.fromEntries((escolas || []).map((e) => [String(e.id), e]))
}

/**
 * Município da escola da equipe. FONTE ÚNICA do campus (spec 046): a distribuição
 * (admin) e a 3ª correção (`/correcao`) têm de chamar ISTO, senão uma delas passa a
 * comparar o município oficial com o campo `cidade` digitado no cadastro e a
 * restrição "ninguém corrige o próprio campus" enfraquece exatamente onde mais importa.
 * Sem município conhecido devolve string vazia, ou seja, sem restrição (o admin avisa
 * antes de confirmar a distribuição).
 */
export function campusDaEquipe(equipe, escolasPorId) {
  const escola = escolasPorId?.[String(equipe?.escolaId ?? '')]
  const municipio = escola?.municipio || equipe?.cidade || ''
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
export function distribuir(equipes, campusPorEquipe = {}, faseId = FASE_ALVO) {
  const carga = {}
  for (const c of CORRETORES) carga[c.id] = 0
  const atribuido = {}

  const elegiveis = (equipes || [])
    .filter((e) => e?.id && e.id !== EQUIPE_EXCLUIDA_RECALC_ID)
    .filter((e) => respostaTarefaDaFase(e, faseId)?.status === 'entregue')
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
// Estado da correção (spec 046)
// ---------------------------------------------------------------------------

/**
 * Junta a correção de um corretor ao doc da equipe. PURO, sem I/O; quem escreve é
 * `salvarCorrecao`, dentro da transação.
 *
 * O merge do Firestore SOMA mapas, mas SUBSTITUI arrays. Era por isso que `enviados`
 * perdia o primeiro corretor a cada envio e que `criterios` (que não tinha dono) era
 * sobrescrito pelo segundo: o registro da banca se perdia e a coluna "Corrigidas" voltava
 * para a fila depois do reload. Aqui os dois são mesclados à mão e cada corretor ganha a
 * sua própria divisória de 47 respostas.
 *
 * Doc sem `criteriosPorCorretor` é da spec 044 (ou não existe): entra limpo. O layout
 * antigo tinha um `criterios` sem dono e `enviados` sobrescrito a cada envio, então não
 * dá para confiar em nenhuma nota que estiver nele; eram só dados de teste.
 */
export function mesclarCorrecao(atual, { equipeId, corretorId, nota, criterios = {}, zerados = [], autorUid = '', em = null }) {
  const base = atual && typeof atual === 'object' && !Array.isArray(atual) && atual.criteriosPorCorretor ? atual : {}
  return {
    equipeId: base.equipeId || equipeId,
    enviados: Array.from(new Set([...(base.enviados || []), corretorId])),
    notas: { ...(base.notas || {}), [corretorId]: nota },
    criteriosPorCorretor: { ...(base.criteriosPorCorretor || {}), [corretorId]: criterios },
    zeradosPorCorretor: { ...(base.zeradosPorCorretor || {}), [corretorId]: [...zerados] },
    autorUid: autorUid || base.autorUid || '',
    atualizadoEm: em || new Date().toISOString(),
  }
}

/**
 * Critérios de um corretor dentro do doc da equipe: a divisória dele, e nada mais. O
 * layout antigo da spec 044 (um `criterios` solto, sem dono) não é lido.
 */
export function criteriosDaCorrecao(doc, corretorId) {
  const meus = doc?.criteriosPorCorretor?.[corretorId]
  return meus && Object.keys(meus).length ? meus : null
}

export function zeradosDaCorrecao(doc, corretorId) {
  const meus = doc?.zeradosPorCorretor?.[corretorId]
  return Array.isArray(meus) ? meus : []
}

/**
 * Decide o veredito de um portfólio. PURO, sem I/O.
 *
 * `atrib` são TODOS os corretores designados para a equipe (2, ou 3 depois da 3ª
 * correção); `notas` são as notas já gravadas. Só conta quem é de `atrib` e tem nota
 * numérica. Foi exatamente o descasamento entre as duas listas que travava o sistema em
 * `aguardando-par` para sempre na spec 044: o board só enxerga as correções que têm o
 * nome dele em `enviados`, então o 2º corretor nunca via a nota do 1º.
 */
export function decidirVeredito({ atrib = [], notas = {}, campus = '', carga = {} } = {}) {
  const designados = Array.isArray(atrib) ? atrib : []
  const fechados = designados.filter((id) => typeof notas[id] === 'number')
  const pares = fechados.map((corretorId) => ({ corretorId, nota: notas[corretorId] }))
  const valores = pares.map((p) => p.nota)
  const esperando = designados.filter((id) => typeof notas[id] !== 'number')

  // 3º já designado e ainda sem nota: tem de ESPERAR. Fechar aqui usaria a média de 2
  // justamente no caso em que a 3ª correção foi exigida.
  if (designados.length >= 3 && fechados.length < 3) {
    return {
      status: 'aguardando-terceira',
      atribuido: [...designados],
      terceira: esperando.length ? esperando[esperando.length - 1] : null,
      notas: pares,
    }
  }

  if (pares.length < 2) return { status: 'aguardando-par', atribuido: [...designados], notas: pares }

  // `designados.length === 2` impede escalar um 4º corretor quando o 3º já está
  // designado e ainda não respondeu; `escolherTerceiro` só exclui quem já enviou.
  const terceiro =
    pares.length === 2 && designados.length === 2 && precisaTerceira(valores)
      ? escolherTerceiro({ campus, jaAtribuidos: fechados, carga })
      : null

  if (terceiro) {
    return {
      status: 'aguardando-terceira',
      atribuido: [...fechados, terceiro.id],
      terceira: terceiro.id,
      terceiraNome: terceiro.nome,
      divergencia: Math.abs(valores[0] - valores[1]),
      notas: pares,
    }
  }

  return {
    status: 'fechado',
    atribuido: [...fechados],
    notas: pares,
    notaFinal: notaFinal(valores),
  }
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

  // 12. mesclagem: o 2º corretor não pode apagar o 1º
  const em = '2026-01-01T00:00:00.000Z'
  const umCorrecao = mesclarCorrecao(null, { equipeId: 'eq1', corretorId: 'glayds', nota: 80, criterios: { c1: 'ct' }, zerados: ['c2'], autorUid: 'glayds@x', em })
  if (umCorrecao.enviados.join() !== 'glayds' || umCorrecao.notas.glayds !== 80) throw new Error('Primeiro envio tem de registrar o corretor.')
  const doisCorrecoes = mesclarCorrecao(umCorrecao, { equipeId: 'eq1', corretorId: 'stenio', nota: 55, criterios: { c1: 'dt' }, zerados: [], em })
  if (doisCorrecoes.enviados.join() !== 'glayds,stenio') throw new Error('enviados tem de SOMAR, não substituir (merge do Firestore troca array).')
  if (doisCorrecoes.notas.glayds !== 80 || doisCorrecoes.notas.stenio !== 55) throw new Error('As duas notas têm de sobreviver ao merge.')
  if (doisCorrecoes.criteriosPorCorretor.glayds.c1 !== 'ct' || doisCorrecoes.criteriosPorCorretor.stenio.c1 !== 'dt') {
    throw new Error('Cada corretor tem de ter as suas 47 respostas.')
  }
  if (doisCorrecoes.zeradosPorCorretor.glayds.join() !== 'c2' || doisCorrecoes.zeradosPorCorretor.stenio.join() !== '') {
    throw new Error('Os itens zerados por IA também são por corretor.')
  }
  const soLeve = mesclarCorrecao(doisCorrecoes, { equipeId: 'eq1', corretorId: 'stenio', nota: 60, em })
  if (soLeve.enviados.join() !== 'glayds,stenio' || soLeve.criteriosPorCorretor.glayds.c1 !== 'ct') {
    throw new Error('Reenvio do mesmo corretor não pode duplicar enviados nem perder o colega.')
  }

  // 13. leitura das respostas: só a divisória do próprio corretor
  if (criteriosDaCorrecao(null, 'glayds') !== null) throw new Error('Doc ausente não tem critérios.')
  if (criteriosDaCorrecao(doisCorrecoes, 'maxsuel') !== null) throw new Error('Corretor que não mandou não tem respostas.')
  if (criteriosDaCorrecao(doisCorrecoes, 'glayds').c1 !== 'ct') throw new Error('Cada um abre com as suas 47 respostas.')
  if (criteriosDaCorrecao(doisCorrecoes, 'stenio').c1 !== 'dt') throw new Error('As do colega não podem vazar para a minha tela.')
  if (zeradosDaCorrecao(doisCorrecoes, 'glayds').join() !== 'c2') throw new Error('Os IA zerados são os meus.')
  if (zeradosDaCorrecao(doisCorrecoes, 'stenio').length !== 0) throw new Error('IA zerado do colega não é o meu.')

  // 14. doc da spec 044 é descartado inteiro, nota de teste junto
  const daSpec044 = { equipeId: 'eq1', enviados: ['stenio'], notas: { stenio: 40 }, criterios: { c1: 'dt' }, zerados: ['c1'] }
  const limpo = mesclarCorrecao(daSpec044, { equipeId: 'eq1', corretorId: 'glayds', nota: 80, criterios: { c1: 'ct' }, em })
  if (limpo.enviados.join() !== 'glayds') throw new Error('Layout antigo: a lista de quem corrigiu tem de recomeçar.')
  if (limpo.notas.stenio !== undefined) throw new Error('Layout antigo: a nota de teste não pode sobreviver.')
  if (Object.hasOwn(limpo, 'criterios')) throw new Error('Layout antigo: o campo sem dono tem de sumir.')
  if (Object.hasOwn(limpo, 'zerados')) throw new Error('Layout antigo: o campo sem dono tem de sumir.')
  if (mesclarCorrecao(doisCorrecoes, { equipeId: 'eq1', corretorId: 'glayds', nota: 80, em }).notas.stenio !== 55) {
    throw new Error('Doc já da spec 046 tem de ser preservado inteiro.')
  }

  // 15. o par fecha (o bug da spec 044: o 2º corretor via só 1 nota e travava aqui)
  const vereditoPar = decidirVeredito({ atrib: ['glayds', 'stenio'], notas: { glayds: 80, stenio: 55 }, campus: '', carga: {} })
  if (vereditoPar.status !== 'aguardando-terceira') throw new Error('80 e 55 divergem 25: tem de pedir a 3ª correção.')
  if (vereditoPar.terceira === 'glayds' || vereditoPar.terceira === 'stenio') throw new Error('O 3º não pode ser um dos dois primeiros.')
  if (!vereditoPar.atribuido.includes(vereditoPar.terceira) || vereditoPar.atribuido.length !== 3) throw new Error('O 3º tem de entrar na lista de designados.')

  const semPar = decidirVeredito({ atrib: ['glayds', 'stenio'], notas: { glayds: 80 }, campus: '' })
  if (semPar.status !== 'aguardando-par') throw new Error('Uma nota só é aguardando-par.')

  const perto = decidirVeredito({ atrib: ['glayds', 'stenio'], notas: { glayds: 90, stenio: 75 }, campus: '' })
  if (perto.status !== 'fechado' || perto.notaFinal !== 82.5) throw new Error('Divergência de 15 fecha direto na média (82,5).')

  const tresNotas = decidirVeredito({ atrib: ['glayds', 'stenio', 'maxsuel'], notas: { glayds: 80, stenio: 55, maxsuel: 70 }, campus: '' })
  if (tresNotas.status !== 'fechado' || tresNotas.notaFinal !== 75) throw new Error('Com 3 notas: descarta a menor e mede as 2 maiores → 75.')

  // 16. 3º já designado não escala um 4º e não fecha com 2 notas
  const aguardando = decidirVeredito({ atrib: ['glayds', 'stenio', 'maxsuel'], notas: { glayds: 80, stenio: 55 }, campus: '' })
  if (aguardando.status !== 'aguardando-terceira' || aguardando.atribuido.length !== 3 || aguardando.terceira !== 'maxsuel') {
    throw new Error('Com o 3º já designado, tem de esperar por ele, não escalar um 4º nem fechar com 2.')
  }

  // 17. a 3ª correção respeita o campus da equipe
  const jp = decidirVeredito({ atrib: ['glayds', 'stenio'], notas: { glayds: 80, stenio: 55 }, campus: 'joao pessoa', carga: {} })
  if (['stenio', 'fabricio', 'cristina'].includes(jp.terceira)) throw new Error('3ª correção não pode cair em quem é do campus da equipe.')

  // 18. campus: município oficial vence o `cidade` digitado no cadastro
  const escolas = indiceEscolasPorId([{ id: '1', municipio: 'João Pessoa' }, { id: '2', municipio: 'Picuí' }])
  if (campusDaEquipe({ escolaId: '1', cidade: 'Recife' }, escolas) !== 'joao pessoa') throw new Error('O município da escola manda no campus.')
  if (campusDaEquipe({ escolaId: '2' }, escolas) !== 'picui') throw new Error('Campus por município oficial.')
  if (campusDaEquipe({ escolaId: '99', cidade: 'Campina Grande' }, escolas) !== 'campina grande') throw new Error('Sem escola no índice, cai no cidade.')
  if (campusDaEquipe({ escolaId: '99' }, escolas) !== '') throw new Error('Sem município conhecido, sem restrição.')
  if (Object.keys(escolas).length !== 2) throw new Error('Índice de escolas por id.')
}
