// Check mínimo (spec 055). Rodar: node src/lib/prazoFinal.test.mjs
import assert from 'node:assert'
import { FIM_PRESENCA_MS, INICIO_TAMANHOS_MS, INICIO_PRESENCA_EXTRA_MS, presencaAberta, tamanhosAbertos, podeConfirmarPresenca } from './prazoFinal.js'
import { planejarConvocacao } from './convocacaoFinal.js'

assert.equal(presencaAberta(FIM_PRESENCA_MS - 1), true)
assert.equal(presencaAberta(FIM_PRESENCA_MS), false)
assert.equal(tamanhosAbertos(INICIO_TAMANHOS_MS - 1), false)
assert.equal(tamanhosAbertos(INICIO_TAMANHOS_MS), true)
assert.ok(INICIO_TAMANHOS_MS - FIM_PRESENCA_MS === 60 * 1000)

const faseIds = ['f1', 'f2', 'f3']
const plano = planejarConvocacao([
  { id: 'a', nome: 'Fica', aprovadoAte: 'fase_final', presencaFinalConfirmada: true, df: 100 },
  { id: 'b', nome: 'Sai', aprovadoAte: 'fase_final', df: 90 },
  { id: 'c', nome: 'Sobe', aprovadoAte: 'fase4', df: 80 },
  { id: 'd', nome: 'Fica fora', aprovadoAte: 'fase4', df: 70 },
  { id: 'e', nome: 'Cedo', aprovadoAte: 'fase3', df: 200 },
], faseIds, 2)

assert.deepEqual(plano.ficam.map((eq) => eq.id), ['a'])
assert.deepEqual(plano.saem.map((eq) => eq.id), ['b'])
assert.deepEqual(plano.sobem.map((eq) => eq.id), ['c'])
assert.equal(plano.faltam, 1)

const cheia = planejarConvocacao([
  { id: 'a', aprovadoAte: 'fase_final', presencaFinalConfirmada: true, df: 1 },
  { id: 'b', aprovadoAte: 'fase4', df: 9 },
], faseIds, 1)
assert.equal(cheia.sobem.length, 0)
assert.equal(cheia.faltam, 0)

assert.equal(podeConfirmarPresenca({ convocacaoExtra: true }, INICIO_PRESENCA_EXTRA_MS - 1), false)
assert.equal(podeConfirmarPresenca({ convocacaoExtra: true }, INICIO_PRESENCA_EXTRA_MS), true)
assert.equal(podeConfirmarPresenca({ convocacaoExtra: true, presencaFinalConfirmada: true }, INICIO_PRESENCA_EXTRA_MS), false)
assert.equal(podeConfirmarPresenca({}, INICIO_PRESENCA_EXTRA_MS), false)
assert.equal(podeConfirmarPresenca({}, FIM_PRESENCA_MS - 1), true)

console.log('prazoFinal ok')
