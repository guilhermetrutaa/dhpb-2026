// Check mínimo (spec 059). Rodar: node src/lib/certificadoPdf.test.mjs
import assert from 'node:assert'
import { readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { gerarCertificadoPdf } from './certificadoPdf.js'

const fundo = `data:image/jpeg;base64,${readFileSync(new URL('../../public/certificado-fundo.jpg', import.meta.url)).toString('base64')}`

const doc = gerarCertificadoPdf({
  fundo,
  nome: 'Tarcivan Monteiro Formiga',
  equipe: 'Vedetas de Maria Felipe',
  orientador: 'Tarcivan Monteiro Formiga',
  colegas: 'Gabrielly Reinaldo, Isabella Queiroz, Maria Vitória Vieira de Souza, Nome Bem Comprido Para Quebrar Linha',
  escola: 'EEEFM ARRUDA CÂMARA',
  modalidade: 'MÉDIO',
  conclusao: [['Por seu desempenho, concluiu a Fase 4 com carga horária de aproximadamente 32 horas.', false]],
  data: '14 de novembro de 2026',
})

assert.equal(doc.getNumberOfPages(), 1)
const raw = doc.output()
for (const t of ['TARCIVAN MONTEIRO FORMIGA', 'Certificado', 'Composta por:', 'Modalidade:', 'Campina Grande']) {
  assert.ok(raw.includes(t), `faltou "${t}" no PDF`)
}
assert.ok(raw.includes('/DCTDecode'), 'fundo JPEG ausente')

const saida = join(tmpdir(), 'certificado-teste.pdf')
writeFileSync(saida, Buffer.from(doc.output('arraybuffer')))
console.log('OK certificadoPdf', saida)
