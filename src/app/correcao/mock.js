// Dados de simulação da página /correcao. SÓ PARA LOCALHOST.
// Nunca é importado em produção: todas as leituras reais vão para o Firestore
// quando `isLocalDevHost()` é false (ver page.jsx).
//
// Regra de ouro: nenhuma função daqui toca rede, sessão ou credencial.

import { colunaDe, normalizar } from '@/lib/correcao'
import { NIVEIS, CRITERIOS_COM_ID } from '@/lib/criterios'

export const MOCK_CHAVE = 'correcao-simulacao'
export const MOCK_USUARIO = { uid: 'mock-glayds', email: 'glayds@ifpb.pb.br', nome: 'Glayds' }

const ESCOLAS = [
  { nome: 'IFPB Campus Campina Grande', cidade: 'Campina Grande', tipoEscola: 'federal', modalidade: 'medio' },
  { nome: 'IFPB Campus João Pessoa', cidade: 'João Pessoa', tipoEscola: 'federal', modalidade: 'medio' },
  { nome: 'IFPB Campus Cabedelo', cidade: 'Cabedelo', tipoEscola: 'federal', modalidade: 'medio' },
  { nome: 'IFPB Campus Monteiro', cidade: 'Monteiro', tipoEscola: 'federal', modalidade: 'medio' },
  { nome: 'IFPB Campus Picuí', cidade: 'Picuí', tipoEscola: 'federal', modalidade: 'medio' },
  { nome: 'E.E. Professora Cleide Patrocínio', cidade: 'João Pessoa', tipoEscola: 'estadual', modalidade: 'fundamental' },
  { nome: 'E.M.、Tia Toca', cidade: 'Campina Grande', tipoEscola: 'municipal', modalidade: 'fundamental' },
  { nome: 'Colégio Passos', cidade: 'Patos', tipoEscola: 'particular', modalidade: 'medio' },
  { nome: 'Instituto Aurora', cidade: 'João Pessoa', tipoEscola: 'particular', modalidade: 'fundamental' },
  { nome: 'E.E. Marechal Rondon', cidade: 'Cabedelo', tipoEscola: 'estadual', modalidade: 'medio' },
]

const TEMAS = ['rosa', 'verde', 'azul', 'bege']

const ARTISTAS = [
  { nome: 'Cândido Portinari', imagem: '/PORT1_PAG2.jpeg' },
  { nome: 'José de Alencar', imagem: '/PORT3_PAG2.jpeg' },
  { nome: 'Humberto de Alencar Castelo Branco', imagem: '/PORT2_PAG2.jpeg' },
  { nome: 'Ana de Probeia Alencar', imagem: '/PORT4_PAG2.jpeg' },
]

const TEMAS_TITULOS = [
  'A cor que atravessa o sertão',
  'Entre o mar e a memória',
  'Retrato de um povo que canta',
  'O Ofício e a Fé',
  'Vozes do sertão',
]

function portfolioMock(i) {
  const a = ARTISTAS[i % ARTISTAS.length]
  const tema = TEMAS[i % TEMAS.length]
  const img = (n) => ({ url: a.imagem, publicId: `mock/${a.nome}-${n}` })
  return {
    titulo: `${TEMAS_TITULOS[i % TEMAS_TITULOS.length]}`,
    capa: img('capa'),
    img1: img('1'),
    legenda1: `${a.nome}, autor, 1930, óleo sobre tela, 100 × 120 cm, João Pessoa — PB.`,
    nomeArtista: a.nome,
    trajetoria: `${a.nome} nasceu no início do século XX e consolidou sua produção em João Pessoa, onde se dedicou à representação da vida cotidiana. Formou-se em artes visuais e recebeu influência direta do movimento modernista que percorria o Nordeste. Sua obra dialoga com o cotidiano paraibano e com a tradição política local.`,
    tituloObra2: `Composição nº ${i + 1}`,
    img2: img('2'),
    legenda2: `${a.nome}, obra representativa, óleo sobre tela, 80 × 100 cm, Campina Grande — PB.`,
    apresentacao: `A produção de ${a.nome} revela uma linguagem marcada por cores terrosas, composição planar e figuras que ocupam o centro da tela. A trajetória do artista se confunde com a formação cultural da Paraíba: o trabalho, o porto, a fé e o sertão estão presentes em quase toda a série. As obras mostram continuidade e rupturas, indicando um percurso autoral consistente ao longo de décadas de atividade.`,
    tituloObra3: `Estudo nº ${i + 7}`,
    img3: img('3'),
    legenda3: `${a.nome}, obra sob análise, desenho, 30 × 40 cm, João Pessoa — PB.`,
    analise: `A obra sob análise combina elementos formais — linha, massa cromática, geometria — de modo a gerar significados consistentes. A composição organiza o olhar do observador em camadas, e o contexto histórico dobra-se na escolha de temas. A interpretação articula a questão da representação na arte paraibana, evitando generalizações e estereótipos sobre o sujeito representado.`,
    reflexao: `A obra de ${a.nome} nos ajuda a compreender a história da arte brasileira e o conceito de resistência cultural. O trabalho do artista dialoga com as memórias do sertão paraibano e permanece atual.`,
    imgEquipe: img('eq'),
    creditos: `Equipe ${i + 1} — Ana Souza, Bruno Lima, Carla Dias e Prof. Marcos Vieira. E.E. Professora Cleide Patrocínio, João Pessoa.`,
    referencias: `PORTINARI, C. Portinari: catálogo raisonné. São Paulo: Martins Fontes, 2000.\nASSIS, M. A reinvenção da pintura brasileira. Rio de Janeiro: Zahar, 1998.\nFONSECA, J. Cultura paraibana: um guia. João Pessoa: UFCG, 2015.`,
  }
}

const N_EQUIPES = 26

function gerarEquipes() {
  return Array.from({ length: N_EQUIPES }, (_, i) => {
    const escola = ESCOLAS[i % ESCOLAS.length]
    const nome = `Equipe ${String.fromCharCode(65 + (i % 26))}${i}`
    const equipe = {
      id: `mock-eq-${String(i).padStart(2, '0')}`,
      nome,
      escola: escola.nome,
      cidade: escola.cidade,
      tipoEscola: escola.tipoEscola,
      modalidade: escola.modalidade,
      campus: normalizar(escola.cidade),
    }
    return { ...equipe, coluna: colunaDe(equipe) }
  })
}

export const MOCK_EQUIPES = gerarEquipes()

/** Uma correção por corretor atribuído. Metade já "enviada", metade em rascunho. */
function gerarCorrecoes() {
  const out = {}
  MOCK_EQUIPES.forEach((e, i) => {
    const enviada = i % 3 !== 0
    if (!enviada) {
      out[e.id] = {
        equipeId: e.id,
        enviados: [],
        notas: {},
        criterios: {},
        zerados: [],
        atualizadoEm: new Date().toISOString(),
      }
      return
    }
    const criterios = {}
    CRITERIOS_COM_ID.forEach((c, j) => {
      criterios[c.id] = NIVEIS[(i + j) % NIVEIS.length].id
    })
    const notas = {}
    // Two notas simuladas de cada equipe enviada.
    notas.glayds = Math.round(40 + ((i * 13) % 60))
    notas.leonardo = Math.round(45 + ((i * 17) % 55))
    out[e.id] = {
      equipeId: e.id,
      enviados: ['glayds', 'leonardo'],
      notas,
      criterios,
      zerados: [],
      atualizadoEm: new Date().toISOString(),
    }
  })
  return out
}

export const MOCK_CORRECOES = gerarCorrecoes()

export const MOCK_DISTRIBUICAO = {
  versao: 1,
  atribuido: Object.fromEntries(MOCK_EQUIPES.map((e) => [e.id, ['glayds', 'leonardo']])),
  carga: { glayds: 26, leonardo: 26 },
  geradoEm: new Date().toISOString(),
}

export const MOCK_VEREDITOS = {}
for (const e of MOCK_EQUIPES) {
  const c = MOCK_CORRECOES[e.id]
  if (!c || c.enviados.length < 2) {
    MOCK_VEREDITOS[e.id] = { equipeId: e.id, status: 'aguardando-par', atribuido: ['glayds', 'leonardo'], notas: [] }
    continue
  }
  const vals = c.enviados.map((cid) => c.notas[cid])
  const diff = Math.abs(vals[0] - vals[1])
  if (diff >= 20) {
    MOCK_VEREDITOS[e.id] = {
      equipeId: e.id,
      status: 'aguardando-terceira',
      atribuido: [...c.enviados, 'maxsuel'],
      terceira: 'maxsuel',
      notas: c.enviados.map((cid) => ({ corretorId: cid, nota: c.notas[cid] })),
    }
  } else {
    const final = Math.round(((vals[0] + vals[1]) / 2) * 100) / 100
    MOCK_VEREDITOS[e.id] = {
      equipeId: e.id,
      status: 'fechado',
      atribuido: c.enviados,
      notas: c.enviados.map((cid) => ({ corretorId: cid, nota: c.notas[cid] })),
      notaFinal: final,
      delta: final,
    }
  }
}

/** Resposta da tarefa como o `respostaTarefaDaFase` devolveria do Firestore. */
export function mockRespostaTarefa(equipeId) {
  const idx = MOCK_EQUIPES.findIndex((e) => e.id === equipeId)
  if (idx < 0) return null
  const tema = TEMAS[idx % TEMAS.length]
  return {
    status: 'entregue',
    faseId: 'fase4',
    tipo: 'tarefa',
    peso: MOCK_VEREDITOS[equipeId]?.notaFinal || 0,
    design: tema,
    portfolio: portfolioMock(idx),
    atualizadoEm: new Date().toISOString(),
  }
}