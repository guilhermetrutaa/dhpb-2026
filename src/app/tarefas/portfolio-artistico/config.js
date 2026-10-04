export const MIN_CHARS = 2
export const IMG_MAX_BYTES = 3 * 1024 * 1024
export const IMG_MAX_PX = 3000
export const IMG_TIPOS = ['image/jpeg', 'image/png']

const IA = 'Não serão aceitas versões produzidas ou editadas por inteligência artificial.'
const LEGENDA = 'Informe autor, data, técnica, dimensões, localização ou outras informações.'

// tipo: 'linha' (input), 'area' (textarea), 'img' (upload), 'link' (URL opcional)
export const SECOES = [
  {
    eyebrow: 'Cabeçalho',
    titulo: 'Título do portfólio',
    campos: [
      {
        id: 'titulo', tipo: 'linha', max: 200,
        label: '1. Produza um título para o portfólio que represente o artista.',
        orientacao: 'A equipe deve criar um título que dialogue coerentemente com o tema central da tarefa e com o artista escolhido.',
      },
      {
        id: 'capa', tipo: 'img',
        label: 'Capa — identidade visual',
        orientacao: `Faça o upload da imagem da identidade visual escolhida (fotografia, gravura, desenho etc.). Ela ocupará toda a largura do cabeçalho, recortada em 625 px de altura. ${IA}`,
      },
    ],
  },
  {
    eyebrow: 'Seção 1',
    titulo: 'O artista e sua trajetória',
    campos: [
      {
        id: 'img1', tipo: 'img',
        label: 'Imagem 1 — representação imagética do artista',
        orientacao: `Faça o upload de uma fotografia, desenho ou pintura do artista. ${IA}`,
      },
      {
        id: 'legenda1', tipo: 'area', max: 400, rows: 3,
        label: 'Legenda da imagem',
        orientacao: 'Informe autor, data, técnica, dimensões, localização ou outras informações sobre a representação.',
      },
      {
        id: 'nomeArtista', tipo: 'linha', max: 200,
        label: 'Nome do artista',
        orientacao: 'Insira o nome completo do artista escolhido.',
      },
      {
        id: 'trajetoria', tipo: 'area', max: 800, rows: 7,
        label: 'Trajetória',
        orientacao: 'Apresente uma breve biografia: local e ano de nascimento, referências, influências, formação, trajetória profissional e relações com pessoas, grupos e instituições. Situe o artista em seu contexto.',
      },
    ],
  },
  {
    eyebrow: 'Seção 2',
    titulo: 'O artista através da obra',
    campos: [
      {
        id: 'tituloObra2', tipo: 'linha', max: 200,
        label: 'Título original da obra',
        orientacao: 'Informe o título original da obra representativa do trabalho do artista.',
      },
      {
        id: 'img2', tipo: 'img',
        label: 'Imagem 2 — obra representativa',
        orientacao: `Envie uma versão digitalizada que permita perceber estilo, linguagem e escolhas recorrentes. Não use versões produzidas ou editadas por inteligência artificial.`,
      },
      {
        id: 'link2', tipo: 'link', max: 500, opcional: true,
        label: 'Link da obra, caso seja um vídeo ou uma música',
        orientacao: '',
      },
      {
        id: 'legenda2', tipo: 'area', max: 400, rows: 3,
        label: 'Legenda da obra',
        orientacao: LEGENDA,
      },
      {
        id: 'apresentacao', tipo: 'area', max: 1200, rows: 9,
        label: 'Apresentação da identidade artística e das principais características da produção',
        orientacao: 'Apresente as principais obras do artista, considerando título, ano, materiais, técnicas, metodologia, estilo e linguagens. Analise o conjunto da produção, suas transformações, inovações, referências e permanências. Considere os temas recorrentes, técnicas, características visuais ou sonoras, contexto histórico e social e as questões propostas pelo artista. Este tópico trata da produção geral, não de uma obra específica.',
      },
    ],
  },
  {
    eyebrow: 'Seção 3',
    titulo: 'Uma obra sob análise',
    campos: [
      {
        id: 'tituloObra3', tipo: 'linha', max: 200,
        label: 'Título original da obra',
        orientacao: 'Escolha uma obra diferente da apresentada na seção anterior.',
      },
      {
        id: 'img3', tipo: 'img',
        label: 'Imagem 3 — obra sob análise',
        orientacao: `Envie uma versão digitalizada da obra que será analisada. Não use versões produzidas ou editadas por inteligência artificial.`,
      },
      {
        id: 'link3', tipo: 'link', max: 500, opcional: true,
        label: 'Link da obra, caso seja um vídeo ou uma música',
        orientacao: '',
      },
      {
        id: 'legenda3', tipo: 'area', max: 400, rows: 3,
        label: 'Legenda da obra',
        orientacao: LEGENDA,
      },
      {
        id: 'analise', tipo: 'area', max: 1600, rows: 11,
        label: 'Análise da obra',
        orientacao: 'Analise como a obra foi construída, seus elementos visuais, sonoros e materiais, a organização desses elementos e os efeitos produzidos. Relacione-a ao contexto histórico, social e cultural e desenvolva uma interpretação sobre ideias e sentidos, conectando as escolhas ao estilo e às preocupações do artista.',
      },
    ],
  },
  {
    eyebrow: 'Seção 4',
    titulo: 'Reflexão sobre a produção do artista',
    campos: [
      {
        id: 'reflexao', tipo: 'area', max: 800, rows: 7,
        label: 'Reflexão crítica',
        orientacao: 'Reflita sobre o impacto e a relevância do artista e de sua obra, suas escolhas e referências, e como esses tópicos ajudam a compreender e ressignificar o campo artístico e a história da arte. Pesquise ao menos um conceito histórico trabalhado nesta edição do DHPB.',
      },
      {
        id: 'questaoConceito', tipo: 'linha', max: 200,
        label: 'Identificação da questão',
        orientacao: 'Insira o número da questão e o conceito trabalhado. Evite escolher a mesma questão de outra equipe do mesmo orientador.',
      },
    ],
  },
  {
    eyebrow: 'Seção 5',
    titulo: 'A equipe',
    campos: [
      {
        id: 'imgEquipe', tipo: 'img',
        label: 'Imagem 4 — fotografia da equipe',
        orientacao: 'Faça o upload de uma fotografia da equipe.',
      },
      {
        id: 'creditos', tipo: 'area', max: 400, rows: 4,
        label: 'Créditos da equipe',
        orientacao: 'Informe obrigatoriamente o nome da equipe, os componentes, o professor ou professora, a escola e o município.',
      },
    ],
  },
  {
    eyebrow: 'Seção 6',
    titulo: 'Referências',
    campos: [
      {
        id: 'referencias', tipo: 'area', max: 1000, rows: 9,
        label: 'Referências bibliográficas',
        orientacao: 'Cite, conforme a ABNT NBR 6023:2025, até cinco referências utilizadas. Podem ser livros, revistas, sites, artigos, dissertações ou teses. Caso uma ferramenta de inteligência artificial tenha sido usada como corretor ortográfico ou gramatical, indique-a como um dos itens.',
      },
    ],
  },
]

export const CAMPOS = Object.fromEntries(SECOES.flatMap((s) => s.campos).map((c) => [c.id, c]))

export const ABAS = [
  'O artista e sua trajetória',
  'O artista através da obra',
  'Obra sob análise',
  'Reflexão histórica',
  'Aba da equipe',
]

// pag1: lado da Imagem 1. obras (pág. 2 e 3): imgEsq | imgDir | textoAcima | imgAcima.
// Fontes são chaves resolvidas em PortfolioWall.jsx (next/font).
export const TEMAS = [
  {
    id: 'rosa', nome: 'Rosa', bg: '#f9d3dc', accent: '#e39aaa', thumb: '/PORT1_PAG1.jpeg',
    fontes: { titulo: 'lora', tituloItalico: true, heading: 'lora', corpo: 'lora' },
    pag1: 'imgEsq', obras: 'imgEsq',
  },
  {
    id: 'verde', nome: 'Verde', bg: '#cfe5c6', accent: '#86c084', thumb: '/PORT2_PAG1.jpeg',
    fontes: { titulo: 'playfair', tituloItalico: true, heading: 'playfair', corpo: 'montserrat' },
    pag1: 'imgDir', obras: 'imgDir',
  },
  {
    id: 'azul', nome: 'Azul', bg: '#b5dcf3', accent: '#79b1d4', thumb: '/PORT3_PAG1.jpeg',
    fontes: { titulo: 'lora', tituloItalico: false, heading: 'abril', corpo: 'sourceSans' },
    pag1: 'imgEsq', obras: 'textoAcima',
  },
  {
    id: 'bege', nome: 'Bege', bg: '#ecdfa8', accent: '#d2b665', thumb: '/PORT4_PAG1.jpeg',
    fontes: { titulo: 'merriweather', tituloItalico: true, heading: 'merriweather', corpo: 'merriweather' },
    pag1: 'imgDir', obras: 'imgAcima',
  },
]

export const temaPorId = (id) => TEMAS.find((t) => t.id === id) || TEMAS[0]

export function validarImagem({ size, type, width, height }) {
  if (!IMG_TIPOS.includes(type)) return 'Envie uma imagem JPG ou PNG.'
  if (size > IMG_MAX_BYTES) return 'Imagem acima de 3 MB.'
  if (width > IMG_MAX_PX || height > IMG_MAX_PX) return `Resolução acima de ${IMG_MAX_PX} × ${IMG_MAX_PX} px.`
  return ''
}

export const linkValido = (s) => /^https?:\/\/\S+$/i.test((s || '').trim())

// Retorna os labels dos campos obrigatórios ainda incompletos.
export function contarFaltantes(portfolio = {}) {
  return Object.values(CAMPOS)
    .filter((c) => {
      const v = portfolio[c.id]
      if (c.tipo === 'img') return !v?.url
      if (c.opcional) return !!v && !linkValido(v)
      return (v || '').trim().length < MIN_CHARS
    })
    .map((c) => c.label)
}

export function embedUrl(link) {
  const s = (link || '').trim()
  const yt = s.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([\w-]{11})/i)
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`
  const sp = s.match(/open\.spotify\.com\/(?:intl-[a-z]+\/)?(track|album|playlist|episode)\/(\w+)/i)
  if (sp) return `https://open.spotify.com/embed/${sp[1]}/${sp[2]}`
  return ''
}
