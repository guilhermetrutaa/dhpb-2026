import { compareRanking } from './eliminacaoFases.js'
import { EQUIPE_EXCLUIDA_RECALC_ID, round2 } from './recalcularPontuacao.js'

export const RUBRICA_PROVA_FINAL = 'prova-final-2026'
export const SOMA_PESOS_ONLINE = 15
export const PESO_PROVA_FINAL = 16
export const CORTES_EDITAL = { ouro: 10, prata: 25, bronze: 50 }

export function checarPesos(fases) {
  const soma = round2((fases || []).reduce((s, f) => s + (Number(f?.peso) || 0), 0))
  if (soma !== SOMA_PESOS_ONLINE) return { ok: false, soma }
  return { ok: true, soma, pesoProva: PESO_PROVA_FINAL }
}

export function notaDoVeredito(doc) {
  if (!doc || doc.rubrica !== RUBRICA_PROVA_FINAL) return null
  if (doc.status !== 'fechado' || typeof doc.notaFinal !== 'number' || !Number.isFinite(doc.notaFinal)) return null
  return round2(Math.min(100, Math.max(0, doc.notaFinal)))
}

export function planoEncerrar(equipe, nota, pesoProva = PESO_PROVA_FINAL) {
  if (!equipe?.id || equipe.id === EQUIPE_EXCLUIDA_RECALC_ID) return null
  if (typeof nota !== 'number' || !Number.isFinite(nota)) return null
  const notaProvaFinal = round2(Math.min(100, Math.max(0, nota)))
  const diProvaFinal = round2(notaProvaFinal * pesoProva)
  const diAtual = round2(equipe.diProvaFinal || 0)
  const dfAntigo = round2(equipe.df || 0)
  const dfNovo = round2(dfAntigo - diAtual + diProvaFinal)
  const notaAtual = typeof equipe.notaProvaFinal === 'number' ? round2(equipe.notaProvaFinal) : null
  const mudou = notaAtual !== notaProvaFinal || diAtual !== diProvaFinal || dfAntigo !== dfNovo
  return { mudou, notaProvaFinal, diProvaFinal, dfAntigo, dfNovo }
}

export function previaEncerrar(equipes, vereditos, pesoProva = PESO_PROVA_FINAL) {
  const abertos = []
  const itens = []
  for (const eq of equipes || []) {
    if (!eq?.id || eq.id === EQUIPE_EXCLUIDA_RECALC_ID) continue
    const nota = notaDoVeredito(vereditos?.[eq.id])
    if (nota == null) {
      abertos.push(eq.id)
      continue
    }
    const plano = planoEncerrar(eq, nota, pesoProva)
    if (plano) itens.push({ id: eq.id, nome: eq.nome || eq.id, ...plano })
  }
  return { abertos, itens }
}

export function categoriaDe(colocacao, cortes = CORTES_EDITAL) {
  const ouro = Number(cortes?.ouro)
  const prata = Number(cortes?.prata)
  const bronze = Number(cortes?.bronze)
  if (colocacao <= (Number.isFinite(ouro) ? ouro : CORTES_EDITAL.ouro)) return 'ouro'
  if (colocacao <= (Number.isFinite(prata) ? prata : CORTES_EDITAL.prata)) return 'prata'
  if (colocacao <= (Number.isFinite(bronze) ? bronze : CORTES_EDITAL.bronze)) return 'bronze'
  return 'cristal'
}

export function classificarFinal(equipes, faseIds, cortes = CORTES_EDITAL) {
  const lista = (equipes || [])
    .filter((eq) => eq?.id && eq.id !== EQUIPE_EXCLUIDA_RECALC_ID && typeof eq.notaProvaFinal === 'number')
    .map((eq) => ({
      ...eq,
      pontuacao: Object.fromEntries((faseIds || []).map((id) => [id, { ni: eq.pontuacoes?.[id]?.ni || 0 }])),
    }))
  lista.sort((a, b) => compareRanking(a, b, faseIds))
  let colocacao = 1
  return lista.map((eq, i) => {
    if (i > 0 && compareRanking(lista[i - 1], eq, faseIds) !== 0) colocacao = i + 1
    return { id: eq.id, colocacao, premiacao: categoriaDe(colocacao, cortes) }
  })
}

if (process.env.NODE_ENV !== 'production') {
  if (checarPesos([{ peso: 1 }, { peso: 2 }, { peso: 4 }, { peso: 8 }]).ok !== true) throw new Error('Soma 15 libera.')
  const estouro = checarPesos([{ peso: 1 }, { peso: 2 }, { peso: 4 }, { peso: 8 }, { peso: 16 }])
  if (estouro.ok || estouro.soma !== 31) throw new Error('Soma 31 trava e devolve o número.')
  const eq = { id: 'e', df: 100 }
  const p1 = planoEncerrar(eq, 10)
  if (!p1.mudou || p1.notaProvaFinal !== 10 || p1.diProvaFinal !== 160 || p1.dfNovo !== 260) throw new Error('Nota 10 vira di 160.')
  const p2 = planoEncerrar({ ...eq, df: 260, notaProvaFinal: 10, diProvaFinal: 160 }, 10)
  if (p2.mudou) throw new Error('Encerrar de novo não soma.')
  if (notaDoVeredito({ rubrica: 'banners-2026-10', status: 'fechado', notaFinal: 80 }) != null) throw new Error('Rubrica do portfólio não entra.')
  if (notaDoVeredito({ rubrica: RUBRICA_PROVA_FINAL, status: 'aguardando-par', notaFinal: 80 }) != null) throw new Error('Veredito aberto não entra.')
  const previa = previaEncerrar(
    [eq, { id: 'aberta', df: 1 }, { id: EQUIPE_EXCLUIDA_RECALC_ID, df: 9 }],
    { e: { rubrica: RUBRICA_PROVA_FINAL, status: 'fechado', notaFinal: 10 } }
  )
  if (previa.abertos.length !== 1 || previa.itens.length !== 1) throw new Error('Sem veredito fica aberto e a equipe de teste fica de fora.')
  const ranking = classificarFinal([
    { id: 'a', notaProvaFinal: 1, df: 200, pontuacoes: { f3: { ni: 10 } } },
    { id: 'b', notaProvaFinal: 1, df: 200, pontuacoes: { f3: { ni: 20 } } },
    { id: 'c', notaProvaFinal: 1, df: 100, pontuacoes: { f3: { ni: 0 } } },
  ], ['f1', 'f2', 'f3'], { ouro: 1, prata: 2, bronze: 2 })
  if (ranking[0].id !== 'b' || ranking[0].premiacao !== 'ouro') throw new Error('Desempate usa N3.')
  if (ranking[1].colocacao !== 2 || ranking[2].premiacao !== 'cristal') throw new Error('Cortes do admin valem.')
}
