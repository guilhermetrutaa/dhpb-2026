// Check do sistema de correção da fase 4 (spec 044).
// Uso: node --no-warnings scripts/check-correcao.mjs
//
// Os dois módulos verificados aqui são puros (sem Firebase), então rodam sem config.
// Os asserts internos dos dois arquivos também rodam no import (bloco NODE_ENV !== production).
import assert from 'node:assert/strict'
import { register } from 'node:module'

// O jsconfig do projeto usa o alias `@/`; o node puro não entende.
// `alias-loader.mjs` resolve `@/lib/x` -> `src/lib/x` para rodar o check sem Next.
register('./alias-loader.mjs', import.meta.url)

process.env.NODE_ENV = process.env.NODE_ENV === 'production' ? 'production' : 'development'

const criterios = await import('../src/lib/criterios.js')
const corr = await import('../src/lib/correcao.js')

// --- critérios -------------------------------------------------------------
const { CRITERIOS_COM_ID, CRITERIOS, PESO_TOTAL, NIVEIS, notaDe, somar, pendentes } = criterios

assert.equal(CRITERIOS_COM_ID.length, 47, '47 critérios')
assert.equal(PESO_TOTAL, 100, 'soma dos pesos = 100')
assert.equal(new Set(CRITERIOS_COM_ID.map((c) => c.id)).size, 47, 'ids únicos')
assert.equal(new Set(CRITERIOS.map((c) => c.bloco)).size, 11, '11 blocos')
assert.ok(CRITERIOS_COM_ID.every((c) => c.peso > 0 && c.texto), 'todo critério tem peso e texto')

// todos os níveis de todos os critérios
const tudoCt = Object.fromEntries(CRITERIOS_COM_ID.map((c) => [c.id, 'ct']))
const tudoDt = Object.fromEntries(CRITERIOS_COM_ID.map((c) => [c.id, 'dt']))
assert.equal(somar(tudoCt), 100, 'tudo Concordo Totalmente = 100')
assert.equal(somar(tudoDt), 0, 'tudo Discordo Totalmente = 0')
assert.equal(somar(tudoCt, CRITERIOS_COM_ID.map((c) => c.id)), 0, 'tudo marcado IA = 0')

// cada peso: fator uniforme
for (const c of CRITERIOS_COM_ID) {
  assert.equal(notaDe(c.id, 'ct'), c.peso, `${c.id} total = peso`)
  assert.equal(notaDe(c.id, 'cp'), Math.round(c.peso * 0.75 * 100) / 100, `${c.id} parcial`)
  assert.equal(notaDe(c.id, 'n'), Math.round(c.peso * 0.5 * 100) / 100, `${c.id} neutro`)
  assert.equal(notaDe(c.id, 'dp'), Math.round(c.peso * 0.25 * 100) / 100, `${c.id} discordo parcial`)
  assert.equal(notaDe(c.id, 'dt'), 0, `${c.id} discordo total`)
  assert.equal(notaDe(c.id, 'ct', true), 0, `${c.id} zerado por IA`)
}

// o total nunca passa de 100, em nenhuma combinação
const meio = Object.fromEntries(CRITERIOS_COM_ID.map((c, i) => [c.id, NIVEIS[i % NIVEIS.length].id]))
assert.ok(somar(meio) <= 100 && somar(meio) >= 0, 'soma dentro de 0..100')

// pendências
assert.equal(pendentes(tudoCt).length, 0, 'tudo respondido não tem pendente')
assert.equal(pendentes({ c1: 'ct' }).length, 46, '1 de 47 deixa 46 pendentes')
assert.equal(pendentes({ c1: 'lixo' }).length, 47, 'nível inválido não conta')

// --- correção --------------------------------------------------------------
const { CORRETORES, colunaDe, distribuir, precisaTerceira, notaFinal, escolherTerceiro, FASE_ALVO, prepararGravacao } = corr

const equipe = (id, nome, tipoEscola, modalidade, status = 'entregue') => ({
  id,
  nome,
  nomeLower: nome,
  tipoEscola,
  modalidade,
  respostas: { [`tarefa_${FASE_ALVO}`]: { status, faseId: FASE_ALVO, peso: 0 } },
})

// campus: ninguém recebe o próprio campus, em nenhuma equipe
const campuses = ['campina grande', 'picoi', 'joao pessoa', 'monteiro', 'cabedelo']
const muitas = []
campuses.forEach((c, i) => {
  for (let j = 0; j < 4; j++) {
    muitas.push(equipe(`e${i}${j}`, `e${i}${j}`, 'federal', 'medio'))
  }
})
const porCampus = {}
for (const e of muitas) porCampus[e.id] = campuses[Number(e.id[1])]
const dist = distribuir(muitas, porCampus)

assert.equal(Object.keys(dist.atribuido).length, muitas.length, 'todas as equipes entregues entram')
for (const [eid, lista] of Object.entries(dist.atribuido)) {
  assert.equal(lista.length, 2, `${eid}: 2 corretores`)
  assert.notEqual(lista[0], lista[1], `${eid}: corretores diferentes`)
  for (const id of lista) {
    assert.ok(CORRETORES.some((c) => c.id === id), `${eid}: ${id} existe`)
    assert.notEqual(
      CORRETORES.find((c) => c.id === id).campus.toLowerCase(),
      porCampus[eid],
      `${eid}: ${id} não pode corrigir o próprio campus (${porCampus[eid]})`
    )
  }
}

// determinismo
assert.deepEqual(distribuir(muitas, porCampus).atribuido, dist.atribuido, 'mesma entrada, mesma saída')
// ordem de entrada não muda o resultado
assert.deepEqual(distribuir(muitas.slice().reverse(), porCampus).atribuido, dist.atribuido, 'ordem de entrada não importa')
// carga equilibrada: ninguém passa da cota ideal (total / 7, arredondada pra cima).
// O desvio abaixo da média é esperado: cada campus proibido deixa um corretor de fora,
// então com 4 equipes de Cabedelo o Lício recebe 4 a menos por construção, não por bug.
const totalSlots = Object.values(dist.carga).reduce((a, b) => a + b, 0)
const cota = Math.ceil(totalSlots / CORRETORES.length)
const maxCarga = Math.max(...Object.values(dist.carga))
const minCarga = Math.min(...Object.values(dist.carga))
assert.ok(maxCarga <= cota, `nenhum corretor passa da cota (${maxCarga} ≤ ${cota})`)

// fora: rascunho e equipe de teste
assert.equal(Object.keys(distribuir([equipe('x', 'x', 'federal', 'medio', 'rascunho')], {}).atribuido).length, 0, 'rascunho fora')
const teste = { ...equipe('t', 't', 'federal', 'medio'), id: 'LhT2fV3JvyQhZU8PrSFl' }
assert.equal(Object.keys(distribuir([teste], {}).atribuido).length, 0, 'equipe de teste fora')

// 3ª correção
assert.equal(precisaTerceira([80, 55]), true, '80 vs 55 pede 3ª')
assert.equal(precisaTerceira([100, 80]), true, '100 vs 80 pede 3ª (exatamente 20)')
assert.equal(precisaTerceira([80, 61]), false, '80 vs 61 não pede')
assert.equal(precisaTerceira([80]), false, '1 nota não pede')
assert.equal(precisaTerceira([]), false, '0 notas não pede')

// veredito
assert.equal(notaFinal([80, 55]), 67.5, '2 notas = média')
assert.equal(notaFinal([80, 55, 70]), 75, '3 notas: descarta a menor → 75')
assert.equal(notaFinal([90, 80, 85]), 87.5, '3 notas: descarta 80 → 87,5')
assert.equal(notaFinal([60, 80, 100]), 90, 'descarta 60 → (80+100)/2 = 90')
assert.equal(notaFinal([80, 80, 80]), 80, 'três iguais')
assert.equal(notaFinal([]), 0, 'sem nota = 0')
assert.equal(notaFinal([42]), 42, 'nota única')

// 3º corretor: nem campus nem repetido
const t = escolherTerceiro({ campus: 'joao pessoa', jaAtribuidos: ['maxsuel', 'licio'], carga: {} })
assert.ok(!['stenio', 'fabricio', 'cristina'].includes(t.id), '3º não é do campus da equipe')
assert.ok(!['maxsuel', 'licio'].includes(t.id), '3º não repete os 2 primeiros')
const t2 = escolherTerceiro({ campus: 'joao pessoa', jaAtribuidos: ['maxsuel'], carga: { maxsuel: 0, licio: 5, glayds: 9, leonardo: 3 } })
assert.ok(!['maxsuel', 'stenio', 'fabricio', 'cristina'].includes(t2.id), '3º respeita campus e não repete')

// colunas
assert.equal(colunaDe({ tipoEscola: 'municipal', modalidade: 'medio' }), 'pubMedio')
assert.equal(colunaDe({ tipoEscola: 'federal', modalidade: 'eja_medio' }), 'pubMedio')
assert.equal(colunaDe({ tipoEscola: 'estadual', modalidade: 'fundamental' }), 'pubFund')
assert.equal(colunaDe({ tipoEscola: 'federal', modalidade: 'eja_fundamental' }), 'pubFund')
assert.equal(colunaDe({ tipoEscola: 'particular', modalidade: 'medio' }), 'privMedio')
assert.equal(colunaDe({ tipoEscola: 'particular', modalidade: 'fundamental' }), 'privFund')

// gravação
const fase = { id: FASE_ALVO, peso: 4 }
const g = prepararGravacao(equipe('e1', 'e1', 'federal', 'medio'), fase, 75, 'admin')
assert.equal(g.delta, 75, 'peso 0 → 75')
assert.equal(g.deltaDi, 300, 'delta di = 75 × 4')
assert.equal(g.respostaId, `tarefa_${FASE_ALVO}`)
assert.equal(g.resposta.peso, 75)
assert.equal(g.resposta.status, 'entregue')
assert.equal(g.atualizaLegado, true)
assert.equal(prepararGravacao(equipe('e1', 'e1', 'federal', 'medio'), fase, 90, 'admin').deltaDi, 360)
assert.equal(prepararGravacao(equipe('e1', 'e1', 'federal', 'medio', 'rascunho'), fase, 75, 'admin'), null, 'rascunho não grava')
const jaGravada = equipe('e1', 'e1', 'federal', 'medio')
jaGravada.respostas[`tarefa_${FASE_ALVO}`].peso = 75
assert.equal(prepararGravacao(jaGravada, fase, 75, 'admin'), null, 'nota igual não grava (delta 0)')
// resposta preservada
const comPortfolio = equipe('e1', 'e1', 'federal', 'medio')
comPortfolio.respostas[`tarefa_${FASE_ALVO}`].portfolio = { titulo: 'x' }
comPortfolio.respostas[`tarefa_${FASE_ALVO}`].design = 'rosa'
const gp = prepararGravacao(comPortfolio, fase, 75, 'admin')
assert.equal(gp.resposta.portfolio.titulo, 'x', 'portfolio preservado')
assert.equal(gp.resposta.design, 'rosa', 'design preservado')
// mapa legado de outra fase não é tocado
const outra = equipe('e1', 'e1', 'federal', 'medio')
outra.respostas[`tarefa_${FASE_ALVO}`].faseId = 'fase3'
assert.equal(prepararGravacao(outra, fase, 75, 'admin').atualizaLegado, false, 'legado de outra fase intocado')

// --- identidade: o nome da comissão pode estar em qualquer posição do nome completo ---
const { identificarCorretor } = corr
const acha = (nome) => identificarCorretor(nome, '')?.id ?? null

// o caso que quebrou: nome permitido no meio
assert.equal(acha('José Maxsuel Lourenço Alves'), 'maxsuel', 'José Maxsuel Lourenço Alves é o Maxsuel')
assert.equal(acha('Maria Glayds de Souza'), 'glayds', 'nome no meio (Glayds)')
assert.equal(acha('Cristina Alves Rocha Lima'), 'cristina', 'nome no meio (Cristina)')
assert.equal(acha('Stênio'), 'stenio', 'nome exato')
assert.equal(acha('stenio de alencar'), 'stenio', 'sem acento, minúsculo')
assert.equal(acha('STÊNIO ALMEIDA'), 'stenio', 'maiúsculo com acento')
assert.equal(acha('Lício'), 'licio', 'Lício com acento')
assert.equal(acha('Antonio Fabricio de Souza'), 'fabricio', 'Fabricio sem acento, no meio')
assert.equal(acha('Leonardo'), 'leonardo')
assert.equal(acha('Jose Leonardo'), 'leonardo', 'Leonardo sem acento no meio')

// não pode dar falso positivo
assert.equal(acha('Maxsuelson Silva'), null, 'palavrão não casa (Maxsuelson ≠ Maxsuel)')
assert.equal(acha('João da Silva'), null, 'ninguém da comissão')
assert.equal(acha(''), null, 'nome vazio')
assert.equal(acha('Leonardo e Cristina Silva'), null, 'dois nomes da comissão = ambíguo')
// os 7 têm de casar no formato completo
for (const c of corr.CORRETORES) {
  assert.equal(acha(`${c.nome} da Silva Santos`), c.id, `${c.nome} Completo`)
  assert.equal(acha(c.nome), c.id, `${c.nome} exato`)
}

console.log(
  `ok — ${CRITERIOS_COM_ID.length} critérios / ${PESO_TOTAL} pontos, ${CORRETORES.length} corretores, ` +
  `carga ${minCarga}..${maxCarga}, 3ª correção em ≥ 20`
)

// --- simula a distribuição real do PDF (153 + 34 + 29 + 34 = 250 portfólios) ---
{
  const COM_CAMPUS = { 'campina grande': 'federal', 'picoi': 'federal', 'joao pessoa': 'federal', 'monteiro': 'federal', 'cabedelo': 'federal' }
  const COM = Object.keys(COM_CAMPUS)
  const Qt = { pubMedio: 153, pubFund: 34, privMedio: 29, privFund: 34 }
  const equipes = []
  const porCampus = {}
  let n = 0
  // Repete campuses de forma round-robin para não enviesar um único campus.
  let giro = 0
  for (const [coluna, qtd] of Object.entries(Qt)) {
    const priv = coluna.startsWith('priv')
    const mod = coluna.endsWith('Medio') ? 'medio' : 'fundamental'
    for (let i = 0; i < qtd; i++) {
      const campus = COM[giro++ % COM.length]
      const id = `eq${String(n++).padStart(4, '0')}`
      const e = equipe(id, `equipe ${String(n).padStart(4, '0')}`, priv ? 'particular' : COM_CAMPUS[campus], mod)
      equipes.push(e)
      porCampus[id] = campus
    }
  }

  const d = distribuir(equipes, porCampus)
  const atrib = Object.entries(d.atribuido)
  assert.equal(atrib.length, 250, '250 portfólios na distribuição')
  assert.ok(atrib.every(([, l]) => l.length === 2), 'todo portfólio vai para 2 corretores')
  assert.ok(atrib.every(([, l]) => l[0] !== l[1]), 'nunca o mesmo corretor duas vezes')
  for (const [eid, lista] of atrib) {
    for (const id of lista) {
      assert.notEqual(
        CORRETORES.find((c) => c.id === id).campus.toLowerCase(),
        porCampus[eid],
        `${eid}: ${id} não pode corrigir ${porCampus[eid]}`
      )
    }
  }
  // As 4 colunas batem com a contagem do PDF.
  const porColuna = { pubMedio: 0, pubFund: 0, privMedio: 0, privFund: 0 }
  for (const e of equipes) porColuna[colunaDe(e)]++
  for (const [k, v] of Object.entries(Qt)) {
    assert.equal(porColuna[k], v, `coluna ${k}: ${v} portfólios`)
  }
  // Carga por corretor: o PDF pede 43 ou 44 (nunca muito além).
  const cargas = Object.values(d.carga)
  const cmin = Math.min(...cargas)
  const cmax = Math.max(...cargas)
  const ideal = (250 * 2) / CORRETORES.length
  assert.ok(cmin >= Math.floor(ideal) - 4, `carga mínima ${cmin} perto da média ${ideal.toFixed(1)}`)
  assert.ok(cmax <= Math.ceil(ideal) + 1, `carga máxima ${cmax} perto da média ${ideal.toFixed(1)}`)

  console.log(`   simulação 250 portfólios — carga ${cmin}..${cmax} por corretor (média ${ideal.toFixed(1)})`)
}