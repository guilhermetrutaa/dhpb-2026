// Critérios de correção da tarefa Portfólio Artístico (fase 4).
// Fonte: public/Avaliação_dos portfólio_DHPB_EDITAVEL.xlsx (pesos das células E).
// A fórmula do Excel é inconsistente e o total dele ignora o último bloco — aqui a
// escala é a do PDF aplicada de forma uniforme: 100/75/50/25/0 de qualquer peso.
// A soma dos pesos é 100 pontos.

export const NIVEIS = [
  { id: 'ct', nome: 'Concordo Totalmente', fator: 1 },
  { id: 'cp', nome: 'Concordo Parcialmente', fator: 0.75 },
  { id: 'n', nome: 'Neutro / não tenho certeza', fator: 0.5 },
  { id: 'dp', nome: 'Discordo Parcialmente', fator: 0.25 },
  { id: 'dt', nome: 'Discordo Totalmente', fator: 0 },
]

export const NIVEL_POR_ID = Object.fromEntries(NIVEIS.map((n) => [n.id, n]))

// 11 blocos, na ordem das linhas "COMANDO" do Excel. `rotulo` vai no cabeçalho do painel.
export const BLOCOS = [
  { id: 'titulo', rotulo: 'Título e Identidade visual' },
  { id: 'imagemArtista', rotulo: 'Imagem do artista' },
  { id: 'trajetoria', rotulo: 'Trajetória' },
  { id: 'obra1', rotulo: 'Obra 1: o artista através da obra' },
  { id: 'apresentacao', rotulo: 'Apresentação da identidade artística' },
  { id: 'obra2', rotulo: 'Obra 2: uma obra sob análise' },
  { id: 'analise', rotulo: 'Análise da obra 2' },
  { id: 'referencias', rotulo: 'Referências' },
  { id: 'creditos', rotulo: 'Foto e créditos da equipe' },
  { id: 'gramatica', rotulo: 'Gramática e coerência' },
  { id: 'coesao', rotulo: 'Coesão e apresentação do portfólio' },
]

const C = (bloco, texto, peso) => ({ bloco, texto, peso })

export const CRITERIOS = [
  C('titulo', 'O título criado dialoga com o tema central da tarefa e está coerente com o todo do portfólio.', 2),
  C('titulo', 'A identidade visual é criativa e está correlacionada com o conteúdo do texto produzido pela equipe.', 2),
  C('titulo', 'O título e a identidade visual despertam o interesse do leitor para o conteúdo apresentado.', 2),
  C('titulo', 'O título e a identidade visual estão formulados de maneira clara e criativa.', 2),

  C('imagemArtista', 'A equipe escolheu a imagem 1 que representa o artista escolhido.', 1),
  C('imagemArtista', 'Há o nome do artista e uma legenda para a imagem 1.', 1),
  C('imagemArtista', 'A legenda apresenta os dados: autor(a), data, técnica, dimensões e localização sobre a representação.', 1),
  C('imagemArtista', 'A imagem selecionada dialoga com o portfólio, convidando o leitor a conhecer o perfil do artista.', 2),

  C('trajetoria', 'O texto desta seção estabelece uma relação explícita entre a figura 1 e o tema central da atividade.', 2),
  C('trajetoria', 'A equipe apresentou uma biografia clara que permite compreender a trajetória do artista escolhido.', 2),
  C('trajetoria', 'A equipe apresenta dados biográficos (nome, naturalidade, ano de nascimento etc.) — pontuação máxima com pelo menos quatro elementos.', 2),
  C('trajetoria', 'A equipe apresenta a formação e as influências que o artista recebeu ao longo da carreira.', 2),
  C('trajetoria', 'A contextualização trata das relações entre pessoas, grupos, instituições e experiências vividas.', 2),

  C('obra1', 'A equipe escolheu, para a obra 1, uma representação da identidade artística que é referência em relação à obra do artista.', 4),
  C('obra1', 'Há o nome da obra e uma legenda para a obra 1.', 1),
  C('obra1', 'A legenda apresenta os dados: autor(a), data, técnica, dimensões e localização sobre a representação.', 1),
  C('obra1', 'A relação entre imagens, artista e legenda está bem articulada.', 2),

  C('apresentacao', 'A apresentação estabelece uma relação explícita entre a obra 1 e o tema central da atividade.', 2.5),
  C('apresentacao', 'A equipe apresentou uma contextualização histórica que permite compreender a relevância da obra escolhida.', 2.5),
  C('apresentacao', 'A apresentação demonstra características da produção, de uma linguagem/estilo que permite a identificação do artista.', 2.5),
  C('apresentacao', 'O texto permite perceber continuidades e/ou rupturas na obra do autor.', 2.5),
  C('apresentacao', 'O texto permite a compreensão geral da obra do artista.', 5),

  C('obra2', 'A escolha da obra 2 foi estratégica para a realização de uma análise estética e histórica.', 4),
  C('obra2', 'Há o nome da obra e uma legenda para a obra 2.', 1),
  C('obra2', 'A legenda apresenta os dados: autor(a), data, técnica, dimensões e localização sobre a representação.', 1),
  C('obra2', 'A relação entre imagem, artista e legenda está bem articulada.', 2),

  C('analise', 'O texto analítico reflete a relação entre a obra 2 e a identidade/estilo do artista escolhido.', 4),
  C('analise', 'A análise demonstra como a combinação dos elementos formais da obra gera significados consistentes.', 4),
  C('analise', 'O texto identifica elementos históricos que problematizam a relação entre a obra e seu contexto.', 4),
  C('analise', 'Há uma interpretação consistente da obra que articula questões, ideias e/ou sentidos da obra.', 4),
  C('analise', 'O texto evita generalizações e estereótipos sobre a obra, o artista e a arte paraibana.', 4),

  C('referencias', 'A equipe apresentou até 5 referências bibliográficas, conforme solicitado.', 1),
  C('referencias', 'Todas as referências estão formatadas de acordo com a ABNT NBR 6023:2025.', 1),
  C('referencias', 'A equipe utilizou referenciais qualificados (livros, revistas, sites, produção acadêmica) na produção do portfólio.', 1),
  C('referencias', 'Todas as referências apresentadas são pertinentes e efetivamente utilizadas na produção do texto.', 2),

  C('creditos', 'A seção contém uma foto da equipe.', 1),
  C('creditos', 'O nome oficial da equipe, o nome da escola e o município foram identificados.', 1),
  C('creditos', 'Na foto apresentada constam todos os integrantes da equipe (é obrigatório o professor aparecer na foto).', 1),
  C('creditos', 'A disposição dos créditos está organizada de acordo com os itens solicitados.', 2),

  C('gramatica', 'NÃO há erros de ortografia e/ou gramática.', 2),
  C('gramatica', 'O texto está bem escrito dentro de uma norma padrão e adequada a uma produção acadêmica.', 2),
  C('gramatica', 'NÃO aparecem frases ou termos ofensivos, pornográficos, que façam apologia a qualquer forma de violência ou preconceito.', 2),
  C('gramatica', 'O portfólio demonstra uma relação clara e lógica entre o texto e as imagens, reforçando a proposta da tarefa.', 2),

  C('coesao', 'As partes do portfólio apresentam coesão que permita que seja lido como partes de um todo.', 2),
  C('coesao', 'Há preocupação estética com a proposta, buscando comunicar-se também pela composição (imagens, organização, equilíbrio etc.) do portfólio.', 2),
  C('coesao', 'As estratégias argumentativas evitam repetições, vícios de linguagem e possuem traços de criatividade e autoria.', 2),
  C('coesao', 'O portfólio consegue apresentar o artista e permitir uma compreensão histórica de sua obra.', 2),
]

// id estável: o índice. Ordena, survives reordenamento do array, e cabe em path do Firestore.
export const CRITERIOS_COM_ID = CRITERIOS.map((c, i) => ({ ...c, id: `c${i + 1}` }))
export const CRITERIO_POR_ID = Object.fromEntries(CRITERIOS_COM_ID.map((c) => [c.id, c]))
export const PESO_TOTAL = CRITERIOS.reduce((s, c) => s + c.peso, 0)

export const CRITERIOS_DO_BLOCO = (bloco) => CRITERIOS_COM_ID.filter((c) => c.bloco === bloco)

/**
 * Pontos de um critério. `zerado` (item com imagem produzida por IA, regra do
 * cabeçalho do Excel B1) vale 0 em qualquer nível. Nível ausente ou inválido = 0.
 */
export function notaDe(id, nivel, zerado = false) {
  if (zerado) return 0
  const criterio = CRITERIO_POR_ID[id]
  if (!criterio) return 0
  const fator = NIVEL_POR_ID[nivel]?.fator
  if (fator === undefined) return 0
  return Math.round(criterio.peso * fator * 100) / 100
}

/** Soma dos pontos. `criterios` = { id: nivel }, `zerados` = Set/lista de ids zerados por IA. */
export function somar(criterios = {}, zerados = []) {
  const z = zerados instanceof Set ? zerados : new Set(zerados || [])
  const total = CRITERIOS_COM_ID.reduce((soma, c) => soma + notaDe(c.id, criterios[c.id], z.has(c.id)), 0)
  return Math.round(total * 100) / 100
}

/** ids sem resposta — bloqueiam o fechamento da correção. Vazio = pronto para fechar. */
export function pendentes(criterios = {}) {
  return CRITERIOS_COM_ID.filter((c) => !NIVEL_POR_ID[criterios[c.id]]).map((c) => c.id)
}

if (process.env.NODE_ENV !== 'production') {
  if (PESO_TOTAL !== 100) {
    throw new Error(`A soma dos pesos tem de dar 100, deu ${PESO_TOTAL}. Confira CRITERIOS.`)
  }
  if (CRITERIOS_COM_ID.length !== 47) {
    throw new Error(`São 47 critérios, temos ${CRITERIOS_COM_ID.length}.`)
  }
  if (notaDe('c1', 'ct') !== 2 || notaDe('c1', 'cp') !== 1.5 || notaDe('c1', 'n') !== 1 || notaDe('c1', 'dp') !== 0.5 || notaDe('c1', 'dt') !== 0) {
    throw new Error('Escala do peso 2 errada: 2 / 1,5 / 1 / 0,5 / 0.')
  }
  if (notaDe('c5', 'ct') !== 1 || notaDe('c5', 'cp') !== 0.75 || notaDe('c5', 'dt') !== 0) {
    throw new Error('Escala do peso 1 errada: 1 / 0,75 / 0.')
  }
  if (notaDe('c14', 'ct') !== 4 || notaDe('c14', 'n') !== 2 || notaDe('c14', 'dp') !== 1) {
    throw new Error('Escala do peso 4 errada: 4 / 3 / 2 / 1 / 0.')
  }
  if (notaDe('c22', 'ct') !== 5 || notaDe('c22', 'cp') !== 3.75 || notaDe('c22', 'dp') !== 1.25) {
    throw new Error('Escala do peso 5 errada: 5 / 3,75 / 2,5 / 1,25 / 0.')
  }
  if (notaDe('c1', 'ct', true) !== 0) {
    throw new Error('Item marcado como IA tem de valer 0 mesmo com Concordo Totalmente.')
  }
  if (notaDe('inexistente', 'ct') !== 0 || notaDe('c1', 'nivel-invalido') !== 0) {
    throw new Error('Critério ou nível inválido tem de dar 0.')
  }
  const tudoCt = {}
  for (const c of CRITERIOS_COM_ID) tudoCt[c.id] = 'ct'
  if (somar(tudoCt) !== 100) throw new Error(`Tudo "Concordo Totalmente" tem de dar 100, deu ${somar(tudoCt)}.`)
  const tudoDt = {}
  for (const c of CRITERIOS_COM_ID) tudoDt[c.id] = 'dt'
  if (somar(tudoDt) !== 0) throw new Error('Tudo "Discordo Totalmente" tem de dar 0.')
  if (somar(tudoCt, CRITERIOS_COM_ID.map((c) => c.id)) !== 0) {
    throw new Error('Todos marcados como IA tem de dar 0.')
  }
  if (somar({ c1: 'ct', c2: 'ct' }) !== 4) throw new Error('Dois critérios de peso 2 no total = 4.')
  if (pendentes(tudoCt).length !== 0) throw new Error('Tudo respondido não pode ter pendente.')
  if (pendentes({ c1: 'ct' }).length !== 46) throw new Error('Um só respondido tem de deixar 46 pendentes.')
  // 2,5 × 0,75 = 1,875 → 1,88 por critério; 4 deles somam 7,52 e não 7,5.
  if (notaDe('c20', 'cp') !== 1.88 || somaRepetida(1.88, 4) !== 7.52) {
    throw new Error('Peso 2,5 no parcial tem de arredondar para 1,88.')
  }
}

function somaRepetida(n, vezes) {
  return Math.round(n * vezes * 100) / 100
}