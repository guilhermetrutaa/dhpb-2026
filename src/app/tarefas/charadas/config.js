export const PDF_DRIVE_URL = ''

export const ICONE_SRC = '/tarefas/charadas/icone-enigma.jpeg'

export const PRATELEIRA_SRC = '/tarefas/charadas/prateleira.svg'

export const DVD_FECHADO_SRC = '/dvd-fechado.png'

export const DVD_ABERTO_SRC = '/dvd-aberto.png'

/** Tempos da abertura automática do DVD, em ms. Ajuste aqui, não no CSS. */
export const DVD_ANIM = {
  delayMs: 600,
  staggerMs: 70,
  duracaoMs: 1400,
}

/**
 * Geometria medida nos PNGs com sharp e conferida visualmente contra as duas
 * referências. O palco é o frame de `dvd-aberto.png` (1448x1086 = 4:3) e todos
 * os valores são percentuais, então o tile continua responsivo.
 *
 * `eixoX` é a dobra real (centro da lombada, x=731.5px), não 50%: as duas
 * costuras dos painéis ficam em 708px e 755px e espelham exatamente nele.
 * A folha (tampa) tem a largura do eixo até a borda externa do painel, então
 * girar 180° em torno de `eixoX` faz a tampa pousar sobre o painel esquerdo
 * sem deslizar.
 */
export const DVD_GEO = {
  eixoX: '50.518%',
  folha: { largura: '47.617%', topo: '10.958%', altura: '79.466%' },
  /** Recorte da caixa fechada (bbox 54..1029 x 117..1347 de 1086x1448). */
  faceFrente: { size: '111.271% 117.628%', position: '49.091% 53.917%' },
  /** Painel esquerdo aberto, do eixo até a borda externa (42..731.5 x 119..982). */
  faceVerso: { size: '210.007% 125.840%', position: '5.537% 53.363%' },
  /** Papel pautado dentro da folha, para o texto da charada. */
  papel: { left: '8.85%', right: '6.02%', top: '5.45%', bottom: '2.32%' },
}

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
