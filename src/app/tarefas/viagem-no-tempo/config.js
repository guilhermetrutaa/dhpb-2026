export const PDF_DRIVE_URL = ''

export const MARCADOR_SRC = '/marcador.svg'

export const FUNDO_SRC = '/tarefas/migalhas-flavio-tavares/recortes/fundo.svg'

export const ANO_MIN = 1500
export const ANO_MAX = 2026
export const ANO_INICIAL = 1763

export const fotoSrc = (id) => `/tarefas/viagem-no-tempo/${id}.webp`

export const INSTRUCAO_ANTES = `Um grupo de amigos encontrou uma máquina bem estranha em um ferro-velho. Embora se considerassem maduros e responsáveis, a curiosidade falou mais alto e eles resolveram mexer no objeto. De repente, em uma fração de segundos, o aparelho disparou uma espécie de choque que atingiu todos de uma vez. Quando se recuperaram, perceberam que estavam em um lugar completamente diferente e que não pertencia à época deles. O impensável tinha acontecido: eles tinham viajado no tempo!

Assim que o susto passou e eles entenderam a situação, decidiram aproveitar a oportunidade para explorar a história e os cenários da Paraíba em diferentes períodos. Usando a própria máquina, o grupo começou a viajar aleatoriamente pelo tempo e pelo espaço. Para garantir que ninguém esqueceria aquela aventura, um dos amigos pegou sua câmera fotográfica e começou a registrar cada detalhe e acontecimento dessa jornada incrível.`

export const INSTRUCAO_DEPOIS = `No entanto, na pressa dos passeios temporais, eles esqueceram de anotar as datas e os locais exatos das fotografias. Agora, as imagens estão misturadas e eles estão perdidos no tempo! A missão da sua equipe é analisar cada registro, decifrar as pistas visuais e descobrir quando e onde essas imagens foram realizadas. A memória dos nossos viajantes depende de vocês!

Ao analisar uma imagem, o historiador procura decifrar vestígios visuais, trabalhando em duas perspectivas que dão sentido à história: a cronologia e a geografia. Determinar a época (datação) e o território (espacialidade) de uma imagem é um método para retirar o documento do isolamento e inseri-lo em um contexto social e cultural.

Para cada imagem, estime o ano no controle deslizante e clique no mapa para marcar o local onde acredita que a imagem foi registrada. A pontuação de localização usa a distância em km até o ponto a que a imagem se refere, quanto mais perto do local correto, maior a pontuação da equipe. A pontuação de temporalidade usa uma margem de datação aproximada até o ano que a imagem se refere, quanto mais preciso for do ano indicado, maior será a pontuação da equipe.

Salve o rascunho de cada imagem (ano + local) antes de passar para a seguinte. Mesmo saindo da página, o rascunho permanece e pode ser alterado.

Quando as 10 imagens estiverem salvas em rascunho, use “Entregar tarefa”. Depois de entregar, nenhuma alteração é possível. Só entregue quando a equipe tiver certeza.`

/** Faixas de |ano escolhido − gabarito|. Degraus de 0,25 (ex.: 0,75). */
export const BANDAS_ANO = [
  { max: 2, pontos: 1 },
  { max: 10, pontos: 0.75 },
  { max: 25, pontos: 0.5 },
  { max: 50, pontos: 0.25 },
]

/** Km do pin ao lat/lng da foto. Até 5 km = 1,00; 10 = 0,75; 20 = 0,50; 40 = 0,25. */
export const BANDAS_LOCAL_KM = [
  { max: 5, pontos: 1 },
  { max: 10, pontos: 0.75 },
  { max: 20, pontos: 0.5 },
  { max: 40, pontos: 0.25 },
]

/** Ordem das imagens 1–10. lat/lng = ponto do local no mapa. Gabarito fechado. */
export const FOTOS = [
  {
    id: 1,
    nome: 'Parque Pedra da Boca',
    cidade: 'Araruna',
    ano: 2000,
    lat: -6.4576612,
    lng: -35.67856,
    mapsUrl: 'https://maps.app.goo.gl/YjREsSVeCAwqkTHJ6',
  },
  {
    id: 2,
    nome: 'Teatro Minerva',
    cidade: 'Areia',
    ano: 1859,
    lat: -6.9677692,
    lng: -35.7016956,
    mapsUrl: 'https://maps.app.goo.gl/QdPPfgKKxxEGF1o1A',
  },
  {
    id: 3,
    nome: 'Açude Coremas-Mãe D’Água',
    cidade: 'Coremas',
    ano: 1949,
    lat: -7.0237239,
    lng: -37.9503225,
    mapsUrl: 'https://maps.app.goo.gl/8WMpz9W3zUhKFDPe8',
  },
  {
    id: 4,
    nome: 'Pedra do Ingá',
    cidade: 'Ingá',
    ano: 1944,
    lat: -7.3249733,
    lng: -35.5852869,
    mapsUrl: 'https://maps.app.goo.gl/ABJsHfPj1w3pZYmD7',
  },
  {
    id: 5,
    nome: 'Igreja de Nossa Senhora da Guia',
    cidade: 'Lucena',
    ano: 1591,
    lat: -6.953921,
    lng: -34.877615,
    mapsUrl: 'https://maps.app.goo.gl/qhu5aZ7LK6iRabe96',
  },
  {
    id: 6,
    nome: 'Barra de Mamanguape',
    cidade: 'Rio Tinto',
    ano: 1860,
    lat: -6.7790218,
    lng: -34.9177073,
    mapsUrl: 'https://maps.app.goo.gl/BNidmZYMcYQNvt6U8',
  },
  {
    id: 7,
    nome: 'Praia Bela',
    cidade: 'Pitimbu',
    ano: 2016,
    lat: -7.4027415,
    lng: -34.8049858,
    mapsUrl: 'https://maps.app.goo.gl/iqkFmjMpn1AqJ52t7',
  },
  {
    id: 8,
    nome: 'Casarão de Zé Pereira',
    cidade: 'Princesa Isabel',
    ano: 1930,
    lat: -7.7350487,
    lng: -37.9912504,
    mapsUrl: 'https://maps.app.goo.gl/3CnNzv77X4W7JiZt5',
  },
  {
    id: 9,
    nome: 'Igreja de Santo Antônio',
    cidade: 'São Mamede',
    ano: 1920,
    lat: -6.9262255,
    lng: -37.0960245,
    mapsUrl: 'https://maps.app.goo.gl/X1nWawVyJpSBDDYGA',
  },
  {
    id: 10,
    nome: 'Olho D’água',
    cidade: 'Picuí',
    ano: 1944,
    lat: -6.511667,
    lng: -36.351389,
    mapsUrl: 'https://maps.app.goo.gl/qDJgYcZJw7Yxq3UK6',
  },
]

function round2(n) {
  return Math.round(n * 100) / 100
}

function faixa(valor, bandas) {
  if (valor == null || Number.isNaN(valor)) return 0
  for (const b of bandas) {
    if (valor <= b.max) return b.pontos
  }
  return 0
}

export function haversineKm(lat1, lng1, lat2, lng2) {
  const toRad = (d) => (d * Math.PI) / 180
  const r = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * r * Math.asin(Math.min(1, Math.sqrt(a)))
}

export function pontosAno(anoEscolhido, foto) {
  if (foto?.ano == null || anoEscolhido == null) return 0
  return faixa(Math.abs(Number(anoEscolhido) - Number(foto.ano)), BANDAS_ANO)
}

export function pontosLocal(lat, lng, foto) {
  if (lat == null || lng == null || foto?.lat == null || foto?.lng == null) return 0
  return faixa(haversineKm(lat, lng, foto.lat, foto.lng), BANDAS_LOCAL_KM)
}

export function imagemCompleta(resposta) {
  return Boolean(
    resposta &&
    resposta.status === 'rascunho' &&
    resposta.ano != null &&
    resposta.lat != null &&
    resposta.lng != null
  )
}

export function todasImagensEmRascunho(imagens) {
  return FOTOS.every((foto) => imagemCompleta(imagens?.[String(foto.id)]))
}

export function calcularPontosTarefa(imagens, teto = 20) {
  let soma = 0
  for (const foto of FOTOS) {
    const r = imagens?.[String(foto.id)]
    if (!r) continue
    soma += pontosAno(r.ano, foto) + pontosLocal(r.lat, r.lng, foto)
  }
  const limite = Number(teto) > 0 ? Number(teto) : 20
  return Math.min(round2(soma), limite)
}
