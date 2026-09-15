export const PDF_DRIVE_URL = 'https://drive.google.com/file/d/1wEBbVD2N7aG_yeFQsQfNZTstTSqUjqvP/view?usp=sharing'

export const IMAGEM_SRC = '/tarefas/migalhas-flavio-tavares/imagem-central.webp'

export const FUNDO_SRC = '/tarefas/migalhas-flavio-tavares/recortes/fundo.svg'

export const recorteSrc = (id) => `/tarefas/migalhas-flavio-tavares/recortes/${id}.svg`

export const PONTOS = [
  { id: 1, left: '5%', top: '89%' },
  { id: 2, left: '42%', top: '93%' },
  { id: 3, left: '53%', top: '90%' },
  { id: 4, left: '58%', top: '93%' },
  { id: 5, left: '12%', top: '80%' },
  { id: 6, left: '42%', top: '76%' },
  { id: 7, left: '87%', top: '78%' },
  { id: 8, left: '72%', top: '61%' },
  { id: 9, left: '73%', top: '34%' },
  { id: 10, left: '86%', top: '28%' },
  { id: 11, left: '51%', top: '28%' },
  { id: 12, left: '10%', top: '27%' },
  { id: 13, left: '53%', top: '51%' },
  { id: 14, left: '37%', top: '72%' },
  { id: 15, left: '51%', top: '66%' },
  { id: 16, left: '74%', top: '76%' },
  { id: 17, left: '91%', top: '74%' },
  { id: 18, left: '92%', top: '61%' },
  { id: 19, left: '22%', top: '78%' },
  { id: 20, left: '49%', top: '88%' },
]

export const FRASES = [
  { id: 'A', texto: 'As figuras sombrias esculpidas em madeira refletem o medo da morte.' },
  { id: 'B', texto: 'Da segurança hídrica das famílias ao potencial turístico.' },
  { id: 'C', texto: 'Os cabelos e as vestes das mulheres revelam práticas cotidianas.' },
  { id: 'D', texto: 'Apresenta a exploração da força de trabalho camponesa.' },
  { id: 'E', texto: 'As várzeas e os vales úmidos que quebram a aridez da paisagem.' },
  { id: 'F', texto: 'O conhecimento passa de geração para geração.' },
  { id: 'G', texto: 'Atividade que interligava o sertão ao litoral.' },
  { id: 'H', texto: 'Símbolo da lentidão e da persistência do trabalho rural.' },
  { id: 'I', texto: 'Com visual único, atrai pelo ecoturismo e pelo misticismo local.' },
  { id: 'J', texto: 'Expõe a espinha dorsal da economia extrativista.' },
  { id: 'K', texto: 'Objeto usado como suporte para ofertas religiosas.' },
  { id: 'L', texto: 'Com visual único, essa formação rochosa tem sua história marcada pelo derramamento do sangue ancestral.' },
  { id: 'M', texto: 'Criados presos para puxar os transportes, consolidaram o trabalho dos vaqueiros.' },
  { id: 'N', texto: 'Conecta atividades agrícolas, festejos tradicionais e a própria sobrevivência do povo sertanejo.' },
  { id: 'O', texto: 'Simboliza uma flora que alterou a paisagem e as relações de trabalho na região.' },
  { id: 'P', texto: 'Com visual único, atrai pela história e pelo misticismo local.' },
  { id: 'Q', texto: 'Fundamentais para o armazenamento de água, essa tecnologia se tornou obsoleta.' },
  { id: 'R', texto: 'Materializa o labor braçal que historicamente construiu a infraestrutura da região.' },
  { id: 'S', texto: 'Ajuda a moldar a identidade geográfica da região.' },
  { id: 'T', texto: 'Artesanato figurativo popular.' },
  { id: 'U', texto: 'Cotidiano e ancestralidade no fazer de mulheres.' },
  { id: 'V', texto: 'A armadura de couro usada para proteger de animais no semiárido paraibano.' },
  { id: 'W', texto: 'Marco das relações de poder na região.' },
  { id: 'X', texto: 'Elementos de devoção que se consolidam em momentos de flagelo.' },
  { id: 'Y', texto: 'Tecnologia utilizada para resfriamento.' },
  { id: 'Z', texto: 'Fundamental para a expansão territorial para o interior.' },
]

export const GABARITO = {
  1: 'O',
  2: 'T',
  3: 'X',
  4: 'K',
  5: 'Z',
  6: 'C',
  7: 'U',
  8: 'H',
  9: 'W',
  10: 'B',
  11: 'S',
  12: 'I',
  13: 'P',
  14: 'D',
  15: 'F',
  16: 'R',
  17: 'N',
  18: 'E',
  19: 'G',
  20: 'Y',
}

export const INSTRUCAO = `Nesta tarefa, a equipe trabalha com a leitura de uma imagem: observar detalhes e associá-los às frases preparadas.

Há 20 números sobre a imagem e 26 frases (letras A a Z). Cada número deve ser associado a uma única frase. Sobram frases que não se ligam a nenhum número.

Para ver detalhes, use o zoom no recorte. Ao clicar no número, abre a lista de frases. Ao clicar em uma frase, a associação é salva automaticamente em rascunho. Mesmo saindo da página, o rascunho permanece e pode ser alterado.

Quando os 20 números estiverem associados, o botão “Entregar tarefa” fica disponível. Depois de entregar, nenhuma alteração é possível. Só entregue quando a equipe tiver certeza.`

export function calcularPontosTarefa(associacoes, teto = 20) {
  let acertos = 0
  for (const ponto of PONTOS) {
    if (associacoes[String(ponto.id)] === GABARITO[ponto.id]) acertos += 1
  }
  const limite = Number(teto) > 0 ? Number(teto) : 20
  return Math.min(acertos, limite)
}

export function frasePorLetra(letra) {
  return FRASES.find((f) => f.id === letra)?.texto || ''
}
