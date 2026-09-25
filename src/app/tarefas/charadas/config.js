export const PDF_DRIVE_URL = ''

export const ICONE_SRC = '/tarefas/charadas/icone-enigma.jpeg'

export const MIDIA_SRC = {
  super8: '/tarefas/charadas/midia-super8.jpg',
  vhs: '/tarefas/charadas/midia-vhs.jpg',
  lata: '/tarefas/charadas/midia-lata.jpg',
  dvd: '/tarefas/charadas/midia-dvd.jpg',
}

export const CAPACIDADES = { 1: 7, 2: 7, 3: 6 }

export const INSTRUCAO = `Nesta tarefa, a equipe assiste aos enigmas da locadora e os coloca na estante “Paraíba” em ordem cronológica.

Cada prateleira é um bloco: a de cima recebe 7 enigmas (bloco 1), a do meio 7 (bloco 2) e a de baixo 6 (bloco 3). Clique no ícone para ler a charada e escolher uma das duas opções. Depois clique na prateleira para alocar. A ordem na prateleira (esquerda para a direita) é a ordem do tempo dentro do bloco.

Salve o rascunho quando quiser. Mesmo saindo da página, o rascunho permanece e pode ser alterado.

Quando os 20 enigmas estiverem nas prateleiras, use “Entregar tarefa”. Depois de entregar, nenhuma alteração é possível. Só entregue quando a equipe tiver certeza.`

const TIPOS = ['super8', 'vhs', 'lata', 'dvd']

function placeholder(index) {
  const n = index + 1
  const id = `e${String(n).padStart(2, '0')}`
  const blocoCorreto = n <= 7 ? 1 : n <= 14 ? 2 : 3
  const ordemNoBloco = blocoCorreto === 1 ? n : blocoCorreto === 2 ? n - 7 : n - 14
  return {
    id,
    tipoMidia: TIPOS[(n - 1) % 4],
    blocoCorreto,
    ordemNoBloco,
    comando: `Charada ${n} (placeholder). Em que período este registro se encaixa?`,
    opcaoA: 'Primeira metade do recorte',
    opcaoB: 'Segunda metade do recorte',
    opcaoCorreta: n % 2 === 0 ? 'B' : 'A',
  }
}

/** 20 enigmas fictícios. Trocar textos e gabarito quando o PDF oficial chegar. */
export const ENIGMAS = Array.from({ length: 20 }, (_, i) => placeholder(i))

export function prateleirasVazias() {
  return { 1: [], 2: [], 3: [] }
}

export function idsAlocados(prateleiras) {
  return new Set([1, 2, 3].flatMap((bloco) => prateleiras[bloco] || prateleiras[String(bloco)] || []))
}

export function alocacaoCompleta(prateleiras) {
  return [1, 2, 3].every((bloco) => (prateleiras[bloco] || prateleiras[String(bloco)] || []).length === CAPACIDADES[bloco])
}

export function gabaritoPrateleiras() {
  const next = prateleirasVazias()
  ENIGMAS.forEach((enigma) => {
    next[enigma.blocoCorreto][enigma.ordemNoBloco - 1] = enigma.id
  })
  return next
}

/** 1 ponto por slot (bloco + índice) igual ao gabarito. Opção A/B não pontua. */
export function calcularPontosTarefa(prateleiras, teto = 20) {
  const gabarito = gabaritoPrateleiras()
  let acertos = 0
  for (const bloco of [1, 2, 3]) {
    const fila = prateleiras[bloco] || prateleiras[String(bloco)] || []
    const certa = gabarito[bloco]
    for (let i = 0; i < certa.length; i += 1) {
      if (fila[i] === certa[i]) acertos += 1
    }
  }
  return Math.min(acertos, teto)
}

// ponytail: one check; swap when official scoring PDF lands
if (process.env.NODE_ENV !== 'production') {
  const cheio = gabaritoPrateleiras()
  if (calcularPontosTarefa(cheio, 20) !== 20) {
    throw new Error('calcularPontosTarefa: gabarito deveria valer 20')
  }
  const vazio = prateleirasVazias()
  if (calcularPontosTarefa(vazio, 20) !== 0) {
    throw new Error('calcularPontosTarefa: vazio deveria valer 0')
  }
  if (alocacaoCompleta(cheio) !== true || alocacaoCompleta(vazio) !== false) {
    throw new Error('alocacaoCompleta quebrou')
  }
}
