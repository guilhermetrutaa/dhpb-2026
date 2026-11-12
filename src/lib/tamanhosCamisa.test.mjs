// Check mínimo (spec 053). Rodar: node src/lib/tamanhosCamisa.test.mjs
import assert from 'node:assert'
import { motivoBloqueioTamanhos, htmlTamanhos } from './tamanhosCamisa.js'

assert.equal(motivoBloqueioTamanhos({}), 'presenca')
assert.equal(motivoBloqueioTamanhos({ presencaFinalConfirmada: false }), 'presenca')
assert.equal(motivoBloqueioTamanhos({ presencaFinalConfirmada: true }), '')
assert.equal(motivoBloqueioTamanhos({ presencaFinalConfirmada: true, tamanhosCamisa: { membros: [] } }), 'ja')

const html = htmlTamanhos([
  { nome: 'Fora', presencaFinalConfirmada: false, membros: [{ uid: '9', nome: 'Nao', status: 'ativo' }] },
  {
    nome: 'Equipe <A>',
    escola: 'Escola X',
    presencaFinalConfirmada: true,
    membros: [
      { uid: '1', nome: 'Ana', papel: 'aluno', status: 'ativo' },
      { uid: '2', nome: 'Inativo', status: 'inativo' },
    ],
    tamanhosCamisa: { membros: [{ uid: '1', tamanho: 'M' }] },
  },
  {
    nome: 'Equipe B',
    escola: 'Escola Y',
    presencaFinalConfirmada: true,
    membros: [{ uid: '3', nome: 'Bia', papel: 'professor_orientador', status: 'ativo' }],
  },
])
assert.ok(html.includes('<table>'))
assert.ok(html.includes('Ana'))
assert.ok(html.includes('>M<'))
assert.ok(html.includes('Escola X'))
assert.ok(html.includes('Equipe &lt;A&gt;'))
assert.ok(!html.includes('Nao'))
assert.ok(!html.includes('Inativo'))
assert.ok(html.includes('Bia'))
assert.ok(html.includes('professor orientador'))
assert.ok(html.includes('P: 0 · M: 1 · G: 0 · GG: 0 · Sem tamanho: 1'))

const repetido = htmlTamanhos([
  {
    nome: 'Eq 1',
    presencaFinalConfirmada: true,
    membros: [{ uid: 'p', nome: 'Prof', papel: 'professor_orientador', status: 'ativo' }],
    tamanhosCamisa: { membros: [{ uid: 'p', tamanho: 'G' }] },
  },
  {
    nome: 'Eq 2',
    presencaFinalConfirmada: true,
    membros: [{ uid: 'p', nome: 'Prof', papel: 'professor_orientador', status: 'ativo' }],
  },
])
assert.equal((repetido.match(/>G</g) || []).length, 2)
assert.ok(repetido.includes('P: 0 · M: 0 · G: 1 · GG: 0 · Sem tamanho: 0'))

console.log('tamanhosCamisa ok')
