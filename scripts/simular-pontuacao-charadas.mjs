// Simulador da nota da tarefa Charadas. Usa as mesmas funções da página
// (`calcularPontosTarefa`), então o que sai aqui é o que vai para o Firestore.
// Uso: node --no-warnings scripts/simular-pontuacao-charadas.mjs [equipesAleatorias]
import {
  ENIGMAS_ABERTOS,
  calcularPontosTarefa,
  capacidadeMovel,
  gabaritoPrateleiras,
  prateleirasVazias,
} from '../src/app/tarefas/charadas/config.js'

const gabarito = gabaritoPrateleiras()
const escolhas = (fn) => Object.fromEntries(ENIGMAS_ABERTOS.map((e, i) => [e.id, { valor: fn(i) }]))
const girar = (fila) => [...fila.slice(1), fila[0]]

const cenarios = [
  { nome: 'Nada feito', enigmas: {}, prateleiras: prateleirasVazias(), esperado: 1.5 },
  { nome: '10 enigmas de 1 ponto, estante vazia', enigmas: escolhas(() => 1), prateleiras: prateleirasVazias(), esperado: 6.5 },
  { nome: '10 enigmas de 2 pontos, estante vazia', enigmas: escolhas(() => 2), prateleiras: prateleirasVazias(), esperado: 11.5 },
  { nome: '10 de 1 ponto, estante perfeita', enigmas: escolhas(() => 1), prateleiras: gabarito, esperado: 15 },
  { nome: '10 de 2 pontos, estante perfeita', enigmas: escolhas(() => 2), prateleiras: gabarito, esperado: 20 },
  {
    nome: '10 de 2 pontos, estante toda fora de lugar',
    enigmas: escolhas(() => 2),
    prateleiras: { 1: girar(gabarito[1]), 2: girar(gabarito[2]), 3: girar(gabarito[3]) },
    esperado: 11.5,
  },
  {
    nome: '5 de 2 + 5 de 1, estante perfeita',
    enigmas: escolhas((i) => (i % 2 ? 1 : 2)),
    prateleiras: gabarito,
    esperado: 17.5,
  },
  {
    nome: '10 de 2, estante perfeita menos 2 caixas trocadas',
    enigmas: escolhas(() => 2),
    prateleiras: { ...gabarito, 1: [gabarito[1][1], gabarito[1][0], ...gabarito[1].slice(2)] },
    esperado: 19,
  },
]

let falhou = false
console.log('\nCENÁRIOS FIXOS (nota = média de resolução e estante, cada uma de 0 a 20)\n')
console.table(
  cenarios.map((c) => {
    const p = calcularPontosTarefa(c)
    const ok = p.nota === c.esperado
    if (!ok) falhou = true
    return { cenario: c.nome, resolucao: p.resolucao, estante: p.estante, nota: p.nota, esperado: c.esperado, ok: ok ? 'sim' : 'NÃO' }
  }),
)

let semente = 20260928
const rand = () => ((semente = (Math.imul(semente, 1103515245) + 12345) >>> 0) / 2 ** 32)
const embaralhar = (lista) => [...lista].sort(() => rand() - 0.5)

const quantas = Number(process.argv[2]) || 8
console.log(`\n${quantas} EQUIPES ALEATÓRIAS (conta refeita à mão na coluna "conferido")\n`)
console.table(
  Array.from({ length: quantas }, (_, n) => {
    const enigmas = escolhas(() => (rand() < 0.5 ? 1 : 2))
    const prateleiras = {}
    for (const bloco of [1, 2, 3]) {
      prateleiras[bloco] = rand() < 0.3 ? [...gabarito[bloco]] : embaralhar(gabarito[bloco])
    }
    const p = calcularPontosTarefa({ enigmas, prateleiras })
    const resolucao = Object.values(enigmas).reduce((s, e) => s + e.valor, 0)
    const estante = 3 + [1, 2, 3].reduce((s, b) => s + prateleiras[b].filter((id, i) => id === gabarito[b][i]).length, 0)
    const conferido = Math.round(((resolucao + estante) / 2) * 100) / 100
    if (conferido !== p.nota) falhou = true
    return {
      equipe: `Equipe ${n + 1}`,
      'enigmas de 2': Object.values(enigmas).filter((e) => e.valor === 2).length,
      'caixas certas (de 17)': estante - 3,
      resolucao: p.resolucao,
      estante: p.estante,
      nota: p.nota,
      conferido,
    }
  }),
)

console.log(`\nMóveis por prateleira: ${[1, 2, 3].map(capacidadeMovel).join(', ')} (+ 1 fixo em cada, que já conta 1 ponto).`)
console.log(falhou ? '\nFALHOU: alguma nota não bate com o esperado.\n' : '\nTudo confere.\n')
process.exit(falhou ? 1 : 0)
