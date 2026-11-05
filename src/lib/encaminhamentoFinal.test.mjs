// Check mínimo (spec 050). Rodar: node src/lib/encaminhamentoFinal.test.mjs
import assert from 'node:assert'
import { decidirEncaminhamento, fasesDoDetalhamento } from './encaminhamentoFinal.js'

// Sem publicação explícita, ninguém vê — mesmo com a Fase 4 já finalizada
assert.equal(decidirEncaminhamento({ fase4Status: 'finalizada', aprovadoAte: 'fase_final', publicado: false }), 'nenhum')
assert.equal(decidirEncaminhamento({ fase4Status: 'finalizada', aprovadoAte: 'fase4' }), 'nenhum')

// Fase 4 ainda não encerrada -> nenhum bloco
assert.equal(decidirEncaminhamento({ fase4Status: 'aberta', aprovadoAte: 'fase_final', publicado: true }), 'nenhum')
assert.equal(decidirEncaminhamento({ fase4Status: 'correcao', aprovadoAte: 'fase4', publicado: true }), 'nenhum')

// Publicado e Fase 4 encerrada
assert.equal(decidirEncaminhamento({ fase4Status: 'finalizada', aprovadoAte: 'fase_final', publicado: true }), 'finalista')
assert.equal(decidirEncaminhamento({ fase4Status: 'finalizada', aprovadoAte: 'fase4', publicado: true }), 'nao-finalista')
assert.equal(decidirEncaminhamento({ fase4Status: 'finalizada', aprovadoAte: 'fase1', publicado: true }), 'nao-finalista')
assert.equal(decidirEncaminhamento({ fase4Status: 'finalizada', aprovadoAte: undefined, publicado: true }), 'nao-finalista')

const fases = [{ id: 'f1' }, { id: 'f2' }, { id: 'f3' }, { id: 'f4' }]

// Finalista vê todas as fases
assert.deepEqual(fasesDoDetalhamento('finalista', fases, 'fase_final'), fases)

// Não-finalista: recorte até a fase aprovada (inclusive)
assert.equal(fasesDoDetalhamento('nao-finalista', fases, 'fase4').length, 4)
assert.equal(fasesDoDetalhamento('nao-finalista', fases, 'fase2').length, 2)
assert.equal(fasesDoDetalhamento('nao-finalista', fases, 'fase1').length, 1)
assert.equal(fasesDoDetalhamento('nao-finalista', fases, undefined).length, 1)

console.log('OK encaminhamentoFinal')
