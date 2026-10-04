// Check da tarefa Portfólio Artístico (spec 042). Uso: node --no-warnings scripts/check-portfolio-config.mjs
import assert from 'node:assert/strict'
import {
  CAMPOS,
  TEMAS,
  contarFaltantes,
  embedUrl,
  validarImagem,
} from '../src/app/tarefas/portfolio-artistico/config.js'

const limites = {
  titulo: 200, legenda1: 400, nomeArtista: 200, trajetoria: 800,
  tituloObra2: 200, link2: 500, legenda2: 400, apresentacao: 1200,
  tituloObra3: 200, link3: 500, legenda3: 400, analise: 1600,
  reflexao: 800, questaoConceito: 200, creditos: 400, referencias: 1000,
}
for (const [id, max] of Object.entries(limites)) assert.equal(CAMPOS[id]?.max, max, id)
for (const id of ['capa', 'img1', 'img2', 'img3', 'imgEquipe']) assert.equal(CAMPOS[id]?.tipo, 'img', id)
assert.equal(TEMAS.length, 4)

const ok = { size: 3 * 1024 * 1024, type: 'image/png', width: 3000, height: 3000 }
assert.equal(validarImagem(ok), '')
assert.ok(validarImagem({ ...ok, size: ok.size + 1 }))
assert.ok(validarImagem({ ...ok, width: 3001 }))
assert.ok(validarImagem({ ...ok, type: 'image/webp' }))

const todos = Object.keys(CAMPOS).length
const obrigatorios = Object.values(CAMPOS).filter((c) => !c.opcional).length
assert.equal(contarFaltantes({}).length, obrigatorios)
const cheio = Object.fromEntries(Object.values(CAMPOS).map((c) => [c.id, c.tipo === 'img' ? { url: 'https://x' } : c.opcional ? '' : 'ok']))
assert.equal(contarFaltantes(cheio).length, 0)
assert.equal(contarFaltantes({ ...cheio, trajetoria: 'a' }).length, 1)
assert.equal(contarFaltantes({ ...cheio, link2: 'nao-e-link' }).length, 1)

assert.equal(embedUrl('https://youtu.be/dQw4w9WgXcQ'), 'https://www.youtube.com/embed/dQw4w9WgXcQ')
assert.equal(embedUrl('https://open.spotify.com/track/abc123'), 'https://open.spotify.com/embed/track/abc123')
assert.equal(embedUrl('https://exemplo.com'), '')

console.log(`ok — ${todos} campos, ${obrigatorios} obrigatórios, ${TEMAS.length} temas`)
