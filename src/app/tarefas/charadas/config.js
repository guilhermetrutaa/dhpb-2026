export const PDF_DRIVE_URL = ''

export const ICONE_SRC = '/tarefas/charadas/icone-enigma.jpeg'
/** Capa dos enigmas já respondidos no PDF: caixa vermelha, só leitura. */
export const RESPONDIDO_SRC = '/quadrado-respondido.webp'

export const PRATELEIRA_SRC = '/tarefas/charadas/prateleira.svg'

/**
 * Capas dos 20 enigmas, reveladas pelo botão "Mostrar Filmes". Os arquivos em
 * `public/tarefas/charadas/capas/` são 1086x1448 (3:4, a mesma proporção do
 * `icone-enigma.jpeg` e dos tiles).
 *
 * `CAPA_EXT` precisa bater com a arte que está na pasta. Já esteve errada: valia
 * `jpg` com os arquivos em `png`, e o resultado eram 20 imagens quebradas no
 * flipped dos quadrados — passava porque o flip não era conferido com a tela
 * aberta. Se trocar a arte, confira a extensão aqui.
 */
const CAPA_EXT = 'png'
export const CAPA_SRC = Array.from(
  { length: 20 },
  (_, i) => `/tarefas/charadas/capas/capa-${String(i + 1).padStart(2, '0')}.${CAPA_EXT}`,
)

/**
 * Zoom da capa dentro do tile, para a caixa de DVD preencher o quadrado do
 * mesmo jeito que preenche a face fechada no modal.
 *
 * As 20 capas são fotos de caixa com a mesma moldura branca em volta — medido,
 * todas têm limites idênticos (x 56..1034, y 114..1368), então um número só
 * serve para as 20. A caixa ocupa 90,05% da largura e 86,60% da altura da arte.
 * O tile é 240/312, um pouco mais largo que a arte (3:4), então `object-cover`
 * corta 8px da altura; sobram 216,1px de 240 e 277,1px de 312 para a caixa. Daí
 * o inverso: 240/216,1 = 1,111 na horizontal e 312/277,1 = 1,126 na vertical.
 *
 * `dvd-fechado.png` tem a mesma moldura (89,9% x 84,8%) e no modal entra
 * recortado por `DVD_GEO.faceFrente`, que é 1,113 x 1,176 — o mesmo tratamento.
 * Precisa de `overflow: hidden` na face, senão a capa vaza para fora do tile.
 */
export const CAPA_NO_TILE = 'scale(1.111, 1.126)'

export const DVD_FECHADO_SRC = '/dvd-fechado.png'

export const DVD_ABERTO_SRC = '/dvd-aberto.png'

/**
 * Tempos da abertura e do fechamento do DVD, em ms. Ajuste aqui, não no CSS.
 * O palco só existe dentro do modal, então montar o modal já é o gatilho:
 * `delayMs` é só a pausa com a tampa fechada antes da rotação, nunca uma
 * cascata na grade. Não reintroduza `staggerMs` aqui.
 */
export const DVD_ANIM = {
  delayMs: 350,
  duracaoMs: 1400,
  /**
   * Saída em TRÊS tempos, nesta ordem: a tampa fecha, a caixa fechada
   * atravessa até o meio da tela (ainda opaca, para a chegada aparecer), fica
   * uma batida parada e só então encolhe e some. Se a ida e o sumiço rodarem
   * juntos a caixa passa pelo centro já apagada e o gesto não se lê.
   */
  saidaCapaMs: 480,
  saidaCentroMs: 400,
  saidaParadaMs: 80,
  saidaPalcoMs: 260,
}

/** Soma dos tempos da saída. É o que o React espera antes de desmontar. */
export const DVD_SAIDA_MS =
  DVD_ANIM.saidaCapaMs + DVD_ANIM.saidaCentroMs + DVD_ANIM.saidaParadaMs + DVD_ANIM.saidaPalcoMs

/** Virada dos tiles no botão ORDENAR: duração e cascata por índice. */
export const FLIP_ANIM = {
  duracaoMs: 620,
  staggerMs: 35,
}

/**
 * Geometria medida nos PNGs com sharp e conferida visualmente com overlay.
 * O palco é o frame de `dvd-aberto.png` (1448x1086 = 4:3) e todos os valores
 * são percentuais, então o mesmo palco serve para qualquer largura de modal.
 *
 * `eixoX` é a dobra real, não 50%: as duas costuras dos painéis foram
 * remedidas em **708px** e **756px**, que espelham em 732px. A folha (tampa)
 * tem a largura do eixo até a borda externa do painel, então girar 180° em
 * torno de `eixoX` faz a tampa pousar sobre o painel esquerdo sem deslizar.
 *
 * Os dois papéis colados (medidos por mascara de corrida mínima, para não
 * pegar o brilho do plástico): esquerdo `190..627 x 283..851`, direito
 * `847..1271 x 277..849`.
 */
export const DVD_GEO = {
  eixoX: '50.518%',
  folha: { largura: '47.617%', topo: '10.773%', altura: '79.650%' },
  /** Recorte da caixa fechada (bbox 54..1029 x 117..1347 de 1086x1448). */
  faceFrente: { size: '111.271% 117.628%', position: '49.091% 53.917%' },
  /** Painel esquerdo aberto, do eixo até a borda externa (42..731.5 x 119..982). */
  faceVerso: { size: '210.007% 125.840%', position: '5.537% 53.363%' },
  /**
   * Zonas de texto dos dois papéis, em `left/top/width/height` — **não** em
   * `right`/`bottom`, que em CSS são distância a partir da borda oposta e dariam
   * largura negativa (o `right` guardado como coordenada soma em vez de
   * subtrair). Medidas no PNG: papel esquerdo 190..627 x 283..851, direito
   * 847..1271 x 277..849.
   *
   * E em **dois sistemas de coordenadas**:
   *
   * - `direita` fica em `.dvd-base`, que é `inset: 0` do palco, então os
   *   valores são % do frame (1448x1086).
   * - `esquerda` fica no verso da tampa, que é a folha: x de 2,901% a 50,518%,
   *   y de 10,773% a 90,423% do frame. Precisa ser convertido para % da folha,
   *   senão a caixa estoura o alto e a base da folha e colapsa para altura 0.
   *
   * A caixa ocupa 88% da largura e 80% da altura de cada papel, centralizada,
   * para caber o texto mais longo do enunciado (257 caracteres em `e03`) sem
   * corte. Se encurtar ou alongar as alternativas, recalcule — a altura do texto
   * cresce com o quadrado do tamanho da fonte.
   */
  texto: {
    esquerda: { left: '25.275%', top: '25.762%', width: '55.770%', height: '52.534%' },
    direita: { left: '60.251%', top: '30.773%', width: '25.768%', height: '42.137%' },
  },

  /**
   * Borda do papel de cada alternativa, no mesmo sistema de coordenadas do
   * texto de cima — `direita` em % do frame, `esquerda` em % da folha. É o
   * retângulo que acende quando o caminho é escolhido, então precisa ser a
   * folha de papel, não a metade do palco.
   *
   * Medido no PNG (1448x1086): papel esquerdo 190..627 x 283..851, direito
   * 847..1271 x 277..849. A fita adesiva do papel esquerdo (y de ~230 a ~283)
   * fica de fora de propósito: a marca é no papel, não na fita.
   *
   * O direito é só escala, porque `.dvd-base` é `inset: 0` do palco e a imagem
   * é 4:3 como o palco. O esquerdo passa por `background-position`, já que a
   * tampa desenha a imagem a 210,007% x 125,840% do element:
   *
   *   elemento% = pos% x (100 − size%) + (px / dim) x size%
   *
   * Checagem: com esses números, o retângulo de `texto` cai estritamente
   * dentro do papel nos dois lados (esquerdo 25,275%..81,045% dentro de
   * 21,465%..84,841%; direito 60,251%..86,019% dentro de 58,495%..87,847%).
   * Se a escala ou a posição da tampa mudar, essa containment é a rede de
   * segurança: se o texto passar a estourar o papel, os números aqui
   * provavelmente estão errados.
   */
  papel: {
    esquerda: { left: '21.465%', top: '19.005%', width: '63.376%', height: '65.817%' },
    direita: { left: '58.495%', top: '25.506%', width: '29.352%', height: '52.762%' },
  },
}


export const CAPACIDADES = { 1: 7, 2: 7, 3: 6 }

export const INSTRUCAO = `Nesta tarefa, a equipe assume o balcão de uma videolocadora e organiza 20 caixas de filmes numa estante em ordem cronológica.

Cada prateleira é um bloco: a de cima recebe 7 caixas (bloco 1), a do meio 7 (bloco 2) e a de baixo 6 (bloco 3).

Passo 1 — abra cada quadrado. A caixa de DVD mostra a pergunta e duas alternativas, uma em cada papel. Não existe alternativa errada: uma vale 1 ponto e a outra vale 2. As 10 caixas vermelhas já vêm respondidas, valem 0 ponto e servem de referência — o papel da alternativa certa fica marcado, e dá para abrir e ler, mas não para escolher.

Passo 2 — escolhido o caminho dos 10 enigmas abertos, clique em ORDENAR: o botão só libera a estante, para você poder arrastar as caixas até ela. Ele não muda o desenho dos quadrados.

Passo 3 — arraste as caixas até a estante para montar a linha do tempo. A ordem na prateleira (esquerda para a direita) é a ordem do tempo dentro do bloco.

Passo 4 — “Mostrar Filmes” vira os quadrados e mostra a capa de cada filme. Abrindo um deles, o DVD aparece com o disco e o papel traz só a alternativa que a equipe escolheu, para conferir. O botão vira “Fechar Filmes”; fechando, os quadrados voltam ao desenho normal e dá para trocar qualquer alternativa e mostrar de novo.

Salve o rascunho quando quiser. Mesmo saindo da página, o rascunho permanece e pode ser alterado.

Quando as 20 caixas estiverem na estante, use “Entregar tarefa”. Depois de entregar, nenhuma alteração é possível. Só entregue quando a equipe tiver certeza.`

/**
 * Os 20 enigmas do `TAREFA.pdf`.
 *
 * Nos 20 **abertos** não existe gabarito: as duas alternativas são caminhos
 * legítimos e o que diferencia é o valor, 1 ou 2 pontos (no PDF saem como 0,5 e
 * 1,0 — corrigido para 1 e 2). `valorBaixo`/`valorAlto` guardam os textos já com
 * o valor certo; qual dos dois fica à esquerda é sorteado por equipe (ver
 * `ordemAlternativas`).
 *
 * Nos 10 **respondidos** existe resposta certa, e é sempre a que vale 1
 * (`VALOR_CORRETO`). O app marca o papel dela, mas não pontua: são referência.
 *
 * `bloco` + `posicao` são a coluna "Colocação na prateleira" do PDF: 1 a 7 na
 * prateleira 1, 8 a 14 na 2, 15 a 20 na 3.
 *
 * `respondido: true` marca os 10 que já vêm resolvidos: capa vermelha, marca no
 * papel da correta e sem clique nas alternativas.
 */
export const ENIGMAS = [
  {
    id: 'e01',
    bloco: 1,
    posicao: 0,
    comando:
      'Nas primeiras décadas do século XX, a Paraíba começou a deixar de ser apenas espectadora para se tornar produtora de imagens. Nesta época, foram produzidas as primeiras imagens em movimento da capital do estado. Sobre esse movimento histórico...',
    valorBaixo:
      'Escolha este caminho se a sua equipe identifica que o ano de 1923 marca o início do Ciclo do Cinema Amador/Primeiras Vistas na Paraíba, impulsionado por realizadores pioneiros como Walfredo Rodriguez',
    valorAlto:
      'Escolha este caminho se sua equipe identifica que as primeiras filmagens documentais em solo paraibano seguiam a lógica das "vistas" urbanas francesas, registrando o progresso urbano encomendado pelas forças políticas da época.',
  },
  {
    id: 'e02',
    bloco: 1,
    posicao: 1,
    comando:
      'Ir ao cinema na Paraíba das primeiras décadas do século XX era um verdadeiro ritual social. Prédios suntuosos foram erguidos, funcionando não apenas para projetar fitas, mas como termômetros da divisão de classes da sociedade. Neste cenário de táticas e estratégias...',
    valorBaixo:
      'Escolha este caminho se a equipe reconhece que os primeiros cinemas de rua (como o Cine Rex ou o Cine Capitólio) funcionavam como os principais centros de entretenimento, lazer e sociabilidade urbana do estado.',
    valorAlto:
      'Escolha este caminho se a equipe compreende que a introdução do cinema alterou os hábitos de lazer urbanos, mas externou na disposição dos assentos as clivagens e preconceitos socioeconômicos das cidades em expansão.',
  },
  {
    id: 'e03',
    bloco: 1,
    posicao: 2,
    respondido: true,
    comando:
      'O cinema depende de tecnologia, engenharia e eletricidade. Na história paraibana, a transição do cinema mudo para o sonoro e a manutenção das salas do interior dependeu da genialidade técnica e das invenções de João Deodato Machado Bittencourt.',
    valorBaixo:
      'Escolha este caminho se equipe entendeu que Machado Bittencourt foi uma das figuras mais importantes da exibição cinematográfica no Nordeste, sendo responsável pela eletrificação e instalação de projetores desafiando o monopólio estrangeiro.',
    valorAlto:
      'Escolha este caminho se equipe analisa que a trajetória dele evidencia a dependência tecnológica e o "subdesenvolvimento" industrial do Nordeste, onde a necessidade de criar "gambiarras" técnicas revelava o isolamento da região frente aos eixos industriais.',
  },
  {
    id: 'e04',
    bloco: 1,
    posicao: 3,
    comando:
      'Nas décadas de 1920 e 1930, surgiram na Paraíba as primeiras iniciativas que tentaram organizar o cinema sob uma lógica empresarial, buscando criar uma indústria local que pudesse competir com o Sudeste. Sobre essas ações...',
    valorBaixo:
      'Escolha este caminho se a equipe identifica que as primeiras empresas estruturadas no estado foram a Aurora Filme e a Parahyba Filme, voltadas para produções comerciais.',
    valorAlto:
      'Escolha este caminho se a equipe percebe que a rápida falência dessas produtoras revela a impossibilidade de consolidação de um mercado regional devido ao monopólio de distribuição das grandes empresas estrangeiras e à falta de apoio fiscal do Estado.',
  },
  {
    id: 'e05',
    bloco: 1,
    posicao: 4,
    comando:
      'Produzir um longa-metragem de ficção com atores e roteiro complexo foi um desafio que a Paraíba só consolidou em 1970. Sobre essa produção cinematográfica...',
    valorBaixo:
      'Escolha este caminho se a equipe sabe que o primeiro longa-metragem de ficção do estado foi O Salário da Morte (1970), dirigido por Linduarte Noronha.',
    valorAlto:
      'Escolha este caminho se a equipe avalia que o filme utiliza a ficção para discutir o coronelismo e a violência agrária, provando que o cinema paraibano instrumentalizou a dramaturgia para denunciar as oligarquias e a impunidade no interior.',
  },
  {
    id: 'e06',
    bloco: 1,
    posicao: 5,
    respondido: true,
    comando:
      'Ele esteve nos bastidores de Aruanda, mas tornou-se o maior cronista documental da Paraíba. Seus filmes misturam investigação histórica com sensibilidade poética, denunciando a violência contra as Ligas Camponesas.',
    valorBaixo:
      'Escolha este caminho se a equipe acredita que nascido em Itabaiana (PB), sua obra O País de São Saruê (1971) foi inteiramente proibida pela Censura Federal do regime militar, sendo liberada para o público somente em 1979.',
    valorAlto:
      'Escolha este caminho se a equipe compreende que o cinema dele funciona como um documento histórico contra a Ditadura Militar, usando o cinema-denúncia para disputar a memória oficial e defender as populações camponesas exploradas.',
  },
  {
    id: 'e07',
    bloco: 1,
    posicao: 6,
    respondido: true,
    comando:
      'Uma charmosa cidade no Cariri paraibano ostenta um enorme letreiro na montanha e vende-se turisticamente como a "Roliúde Nordestina". No entanto, pesquisadores fazem uma dura crítica a esse título de marketing. Por quê...',
    valorBaixo:
      'Escolha este caminho se a equipe compreende que a crítica acadêmica aponta o descompasso entre o uso da imagem da cidade para o turismo cinematográfico e a falta de fomento ou escolas técnicas para que os próprios moradores locais dirijam seus filmes.',
    valorAlto:
      'Escolha este caminho se a equipe entende que o título mascara uma política de fetichização e dependência, onde a cidade funciona apenas como cenário exótico passivo para produtoras do Sudeste, sem desenvolver uma indústria audiovisual local autônoma.',
  },
  {
    id: 'e08',
    bloco: 2,
    posicao: 0,
    comando:
      'Imagine que você tem uma grande ideia na cabeça, mas quase nenhum dinheiro. Você pega uma câmera emprestada, viaja para o interior do estado e grava um filme que muda a história do cinema nacional. Linduarte Noronha...',
    valorBaixo:
      'Escolha este caminho se a equipe idealizou o projeto após publicar uma reportagem fotográfica intitulada "Aruanda" no jornal A União, em 1959.',
    valorAlto:
      'Escolha este caminho se a equipe compreende que ele demonstrou que a possibilidade de fazer cinema não depende de estúdios caros, mas sim de lançar um olhar atento sobre a realidade do nosso povo.',
  },
  {
    id: 'e09',
    bloco: 2,
    posicao: 1,
    respondido: true,
    comando:
      'Sou um lugar que nasceu do desejo de liberdade. No passado, pessoas que escaparam da escravidão criaram esse refúgio no Sertão paraibano. Em 1960, o filme revelou para o mundo que esse lugar ainda resistia.',
    valorBaixo:
      'Escolha este caminho se a equipe localiza esse lugar como a comunidade quilombola de Olho D’Água da Serra do Talhado, situada no município de Santa Luzia.',
    valorAlto:
      'Escolha este caminho se você percebe que a existência desse local denuncia o isolamento geográfico e o abandono por parte do Estado, mostrando que a abolição formal (1888) não foi acompanhada por políticas de inserção social ou direito à terra.',
  },
  {
    id: 'e10',
    bloco: 2,
    posicao: 2,
    respondido: true,
    comando:
      'Na comunidade retratada pelo filme não havia fábricas, lojas ou empregos. A sobrevivência das famílias dependia de transformar a própria terra molhada em objetos úteis para vender na feira.',
    valorBaixo:
      'Escolha este caminho se a equipe identifica que o filme foca na produção artesanal de panelas e potes de cerâmica feitos de barro pelas mulheres da comunidade.',
    valorAlto:
      'Escolha este caminho se a equipe entende que, por conta da aridez e do fracasso de lavouras como o algodão, a manipulação da argila tornou-se o esteio material e de preservação da memória daquela população.',
  },
  {
    id: 'e11',
    bloco: 2,
    posicao: 3,
    comando:
      'Meu nome brilha nas religiões de matriz africana como um paraíso místico de paz e liberdade. Mas no filme, esse nome batiza um lugar de terra rachada e muita pobreza.',
    valorBaixo:
      'Escolha este caminho se a equipe reconhece que o termo provém das tradições afro-brasileiras e expressa a busca por liberdade; Linduarte usou-o para chocar o público ao mostrar que o refúgio geográfico do povo era também um espaço de esquecimento social.',
    valorAlto:
      'Escolha este caminho se você enxerga a ironia social do título, que contrasta o paraíso espiritual prometido com a dura realidade material de exclusão social e fome vivida pelos personagens na caatinga.',
  },
  {
    id: 'e12',
    bloco: 2,
    posicao: 4,
    comando:
      'Eu não sou um ator de Hollywood usando maquiagem. Sou um trabalhador real, líder da minha comunidade, e abri as portas da minha casa e da minha rotina para a câmera do cinema.',
    valorBaixo:
      'Escolha este caminho para a equipe que reconhece que Zé Bento, carpinteiro e ex-escravizado, fundou o local por volta de XIX. No filme, seus descendentes (como Paulino Carneiro) encenam sua caminhada original.',
    valorAlto:
      'Escolha este caminho se sua equipe valoriza que a presença dele na tela significa a conquista do protagonismo do homem negro e camponês no cinema brasileiro, rompendo com os estereótipos caricatos vigentes nas produções comerciais da época.',
  },
  {
    id: 'e13',
    bloco: 2,
    posicao: 5,
    respondido: true,
    comando:
      'Fazer cinema nunca é o trabalho de uma pessoa só. Atrás das câmeras de Aruanda, jovens intelectuais paraibanos ajudaram a planejar, capturar e editar as cenas que chocaram o país.',
    valorBaixo:
      'Escolha este caminho se a equipe entende que o filme foi fruto de um mutirão de jovens da Faculdade de Direito e do meio intelectual da época que fundaram a tradição do documentarismo local.',
    valorAlto:
      'Escolha este caminho se sua equipe compreende que essa parceria demonstra a força do movimento cultural coletivo e universitário na Paraíba dos anos 60, que uniu jovens dispostos a usar o cinema como arma de transformação e denúncia.',
  },
  {
    id: 'e14',
    bloco: 2,
    posicao: 6,
    respondido: true,
    comando:
      'Antes de 1960, o cinema brasileiro tentava imitar os filmes estrangeiros. Aruanda quebrou esse padrão e criou uma estética nova baseada na luz do sol e no realismo, influenciando diretores como Glauber Rocha.',
    valorBaixo:
      'Escolha este caminho se a equipe identifica que o filme é considerado o marco zero do Cinema Novo, movimento famoso pelo lema prático de "uma câmera na mão e uma ideia na cabeça".',
    valorAlto:
      'Escolha este caminho se sua equipe reconhece que Glauber Rocha assistiu a Aruanda em Salvador e declarou publicamente que aquele curta apontava o caminho estético definitivo para a emancipação do cinema nacional frente ao colonialismo cultural.',
  },
  {
    id: 'e15',
    bloco: 3,
    posicao: 0,
    comando:
      'No século XXI, a maneira de fazer cinema sofreu uma revolução técnica. Se antes era preciso rolos de película caríssimos, hoje a juventude consegue produzir narrativas complexas utilizando uma tecnologia que cabe no bolso.',
    valorBaixo:
      'Escolha este caminho se sua equipe reconhece que projetos de formação nas periferias paraibanas subvertem o uso do celular, transformando o aparelho de mero receptor de redes sociais em um emissor de arte política e comunitária.',
    valorAlto:
      'Escolha este caminho se sua equipe analisa que essa tecnologia promove uma quebra do monopólio estético, permitindo que sujeitos historicamente marginalizados narrem suas próprias vivências sem intermediários.',
  },
  {
    id: 'e16',
    bloco: 3,
    posicao: 1,
    respondido: true,
    comando:
      'No século XXI, uma vibrante rede de festivais de cinema espalhou-se pelo Sertão, Cariri e Brejo paraibano. Cidades pequenas transformam praças públicas e igrejas em salas de exibição temporárias. Sobre esse fenômeno...',
    valorBaixo:
      'Escolha este caminho se sua equipe reconhece que eventos como o Cine Congo, o Festissauro e o Curta Coremas interiorizaram o acesso à produção cinematográfica no estado.',
    valorAlto:
      'Escolha este caminho se sua equipe compreende que esses festivais operam como polos de descentralização e resistência cultural, validando o sotaque, a paisagem e a memória do homem do interior contra o monopólio das capitais.',
  },
  {
    id: 'e17',
    bloco: 3,
    posicao: 2,
    respondido: true,
    comando:
      'Durante décadas, o cinema do Sudeste retratou o paraibano sob o estigma do "retirante sofredor" ou do "personagem caricato". No século XXI, os realizadores locais usam as telas para implodir essas visões de fora. Essa disputa de representatividade...',
    valorBaixo:
      'Escolha este caminho se a equipe aponta que o cinema contemporâneo atua como um espaço de autorrepresentação cultural, mostrando a Paraíba a partir dos olhos dos seus próprios realizadores.',
    valorAlto:
      'Escolha este caminho se a equipe analisa que o cinema paraibano atual promove uma fratura nos estereótipos da "nordestinidade", retratando um estado plural, urbano, complexo e tecnológico, tornando o ato de filmar um exercício de soberania.',
  },
  {
    id: 'e18',
    bloco: 3,
    posicao: 3,
    respondido: true,
    comando:
      'Os suntuosos prédios de cinema sumiram dos centros históricos de João Pessoa e Campina Grande. As telas da Paraíba migraram em massa para dentro das caixas de concreto dos shopping centers. Essa transformação...',
    valorBaixo:
      'Escolha este caminho se a equipe identifica que o fechamento dos cinemas de rua (como o Cine Plaza ou o Cine Babilônia) e sua substituição pelas salas multiplex de shoppings administradas por redes estrangeiras alterou o consumo cultural no século XXI.',
    valorAlto:
      'Escolha este caminho se a equipe problematiza que essa transição representa a mercantilização e a elitização do lazer, impondo uma triagem socioeconômica do público e padronizando a programação com blockbusters que sufocam o cinema local.',
  },
  {
    id: 'e19',
    bloco: 3,
    posicao: 4,
    comando:
      'Diante da dominação comercial dos shoppings, um formato histórico de exibição ganhou força de resistência na Paraíba de hoje. Organizados por estudantes e movimentos sociais em espaços alternativos, eles exibem filmes gratuitos seguidos de debates. Que espaços são esses?',
    valorBaixo:
      'Escolha este caminho se a equipe reconhece o fortalecimento e a atuação dos Cineclubes na Paraíba (articulados por coletivos independentes e pela Federação Paraibana de Cineclubes) como circuitos alternativos de difusão.',
    valorAlto:
      'Escolha este caminho se a equipe compreende que o cineclubismo mantém viva a tradição de usar salas públicas, associações de bairro e escolas como polos de conscientização política através de acervos não comerciais.',
  },
  {
    id: 'e20',
    bloco: 3,
    posicao: 5,
    comando:
      'Para o cinema moderno brilhar na Paraíba de hoje, foi preciso plantar bases no passado. No entanto, rolos de película, projetores antigos e documentos raros do século XX sofrem com a falta de investimento e correm o risco de virar poeira. Sobre a importância da preservação de acervos...',
    valorBaixo:
      'Escolha este caminho se a equipe aponta que é urgente e necessária a salvaguarda, catalogação e preservação física e digital do Acervo Histórico como o de Machado Bittencourt, pioneiro técnico da exibição no estado.',
    valorAlto:
      'Escolha este caminho se a equipe analisa que o descaso com esse patrimônio revela a amnésia institucional do estado, onde a destruição das provas materiais do desenvolvimento tecnológico do interior sabota a compreensão da nossa história.',
  },
]

/** Valor das duas alternativas, na ordem em que foram declaradas (baixo, alto). */
export const VALORES = [1, 2]

/**
 * DVD aberto **com o disco**: é o que a equipe vê no modo "Mostrar Filmes", e
 * só nele. O disco já traz a arte do filme, então a capa não precisa (e não
 * deve) aparecer em lugar nenhum — o único desenho que falta é o texto da
 * alternativa no papel, e ele é o mesmo `texto.esquerda` das outras artes: o
 * papel está no mesmo lugar nos dois conjuntos (medido: `x1=628`, `y1=852` nos
 * 20 PNGs, igual ao `dvd-aberto.png`).
 *
 * A pasta se chama `dvd-abertos-respondidos` porque foi criada quando a ideia
 * era só para os respondidos. O nome ficou; o uso não é mais esse.
 */
export const DVD_COM_CD = Object.fromEntries(
  ENIGMAS.map((e) => [e.id, `/tarefas/charadas/dvd-abertos-respondidos/${e.id}.png`]),
)

/** Enigmas que a equipe precisa escolher (os respondidos não pontuam). */
export const ENIGMAS_ABERTOS = ENIGMAS.filter((e) => !e.respondido)

/**
 * Valor da alternativa **certa** nos 10 enigmas que já vêm respondidos: o PDF
 * marca que a correta é a que vale 1. Só eles têm resposta certa — nos 10
 * abertos as duas alternativas são caminhos legítimos e a escolha é da equipe.
 */
export const VALOR_CORRETO = 1

/**
 * Índice dos enigmas respondidos, na ordem do PDF, para alternar de que lado a
 * correta cai. Ver `ordemAlternativas`.
 */
const PARIDADE_RESPONDIDO = new Map(
  ENIGMAS.filter((e) => e.respondido).map((e, i) => [e.id, i % 2]),
)


/**
 * Ordem das alternativas no DVD: qual vai no papel da esquerda e qual no da
 * direita. Sorteada por equipe a partir de uma semente salva no rascunho, para
 * que o par de 1 e 2 pontos não fique sempre do mesmo lado. Determinística:
 * a mesma semente + o mesmo enigma dão sempre a mesma ordem.
 *
 * FNV-1a sozinho não serve: o bit baixo é fraco e saía um padrão quase
 * alternado, além de sementes diferentes caírem na mesma ordem. O `fmix32` do
 * murmur3 no final espalha os bits.
 *
 * **Os respondidos não usam o sorteio.** A média do hash é boa (medido: 50,1%
 * esquerda / 49,9% direita em 2000 sementes x 10 respondidos), mas ele não
 * garante nada para uma equipe específica: 3 dessas 2000 sementes deixaram as
 * 10 corretas no lado direito, e uma deixou as 10 no esquerdo. Como nos
 * respondidos a correta é sempre a mesma (a que vale 1), o risco é a equipe
 * perceber o padrão. Aqui a correta alterna por posição na lista de respondidos
 * — 5 de cada lado para qualquer conjunto de 10, sempre.
 */
export function ordemAlternativas(sorteio, id) {
  const paridade = PARIDADE_RESPONDIDO.get(id)
  if (paridade !== undefined) return paridade === 0 ? [0, 1] : [1, 0]
  let h = 2166136261
  for (const ch of `${sorteio || ''}:${id}`) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  h ^= h >>> 16
  h = Math.imul(h, 2246822507)
  h ^= h >>> 13
  h = Math.imul(h, 3266489909)
  h ^= h >>> 16
  return (h >>> 0) % 2 === 0 ? [0, 1] : [1, 0]
}

/**
 * Texto da alternativa de um valor dado, ou `undefined` se nenhuma tiver. É o
 * que vai no papel no modo "Mostrar Filmes": lá só interessa o da esquerda,
 * porque naquelas artes o lado direito é o disco e não existe segundo papel.
 */
export function textoEscolhido(alternativas, valor) {
  return alternativas.find((a) => a.valor === valor)?.texto
}

/** As duas alternativas de um enigma, na ordem sorteada, com o valor de cada. */
export function alternativasDe(enigma, sorteio) {
  const ordem = ordemAlternativas(sorteio, enigma.id)
  return ordem.map((i) => ({ texto: i === 0 ? enigma.valorBaixo : enigma.valorAlto, valor: VALORES[i] }))
}

export function prateleirasVazias() {
  return { 1: [], 2: [], 3: [] }
}

export function idsAlocados(prateleiras) {
  return new Set([1, 2, 3].flatMap((bloco) => prateleiras[bloco] || prateleiras[String(bloco)] || []))
}

export function alocacaoCompleta(prateleiras) {
  return [1, 2, 3].every((bloco) => (prateleiras[bloco] || prateleiras[String(bloco)] || []).length === CAPACIDADES[bloco])
}

/** Gabarito da estante: a coluna "Colocação na prateleira" do PDF. */
export function gabaritoPrateleiras() {
  const next = prateleirasVazias()
  ENIGMAS.forEach((enigma) => {
    next[enigma.bloco][enigma.posicao] = enigma.id
  })
  return next
}

/** Etapa 1: soma o valor da alternativa escolhida. Os respondidos não pontuam. Teto 20. */
export function calcularPontosResolucao(enigmas = {}, teto = 20) {
  let pontos = 0
  for (const enigma of ENIGMAS_ABERTOS) {
    const v = enigmas[enigma.id]?.valor
    if (v === 1 || v === 2) pontos += v
  }
  return Math.min(pontos, teto)
}

/** Etapa 2: 1 ponto por slot na posição certa. Teto 20. */
export function calcularPontosEstante(prateleiras, teto = 20) {
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

/**
 * Nota final = média aritmética simples das duas etapas, como manda o PDF.
 * `teto` é `fase.tarefa.pontuacao` (20).
 */
export function calcularPontosTarefa({ enigmas = {}, prateleiras }, teto = 20) {
  const resolucao = calcularPontosResolucao(enigmas, teto)
  const estante = calcularPontosEstante(prateleiras, teto)
  return { resolucao, estante, nota: Math.round(((resolucao + estante) / 2) * 100) / 100 }
}

if (process.env.NODE_ENV !== 'production') {
  const cheio = gabaritoPrateleiras()
  const nada = { prateleiras: prateleirasVazias(), enigmas: {} }
  const maxEnigmas = Object.fromEntries(ENIGMAS_ABERTOS.map((e) => [e.id, { valor: 2 }]))
  const c1 = calcularPontosTarefa({ ...nada, enigmas: maxEnigmas })
  const c2 = calcularPontosTarefa({ prateleiras: cheio, enigmas: maxEnigmas })
  const c3 = calcularPontosTarefa(nada)
  if (c1.resolucao !== 20 || c1.nota !== 10) throw new Error('20 enigmas abertos no máximo devem dar 20 de resolução e nota 10')
  if (c2.estante !== 20 || c2.nota !== 20) throw new Error('estante cheia no gabarito deve dar 20 e nota 20')
  if (c3.nota !== 0) throw new Error('sem resposta e sem estante a nota deve ser 0')
  if (ENIGMAS.length !== 20 || ENIGMAS_ABERTOS.length !== 10) throw new Error('devem ser 20 enigmas, 10 abertos')
  if (ENIGMAS.some((e) => e.bloco < 1 || e.bloco > 3)) throw new Error('bloco fora de 1..3')
  const aplicados = new Set(ENIGMAS.map((e) => `${e.bloco}:${e.posicao}`))
  if (aplicados.size !== 20) throw new Error('colocações repetidas na prateleira')
  if (alocacaoCompleta(cheio) !== true || alocacaoCompleta(prateleirasVazias()) !== false) {
    throw new Error('alocacaoCompleta quebrou')
  }
  // o sorteio precisa variar de verdade entre equipes. Só os 10 abertos
  // sorteiam; os respondidos são fixos pela paridade, então medir a variedade
  // nos 20 daria um teto artificial (só 2^10 combinações existem).
  const SEMENTES = 400
  const padroes = new Set()
  const esquerdaPorEnigma = new Map(ENIGMAS_ABERTOS.map((e) => [e.id, 0]))
  for (let s = 0; s < SEMENTES; s += 1) {
    padroes.add(ENIGMAS_ABERTOS.map((e) => ordemAlternativas(`equipe-${s}`, e.id)[0]).join(''))
    for (const e of ENIGMAS_ABERTOS) {
      if (ordemAlternativas(`equipe-${s}`, e.id)[0] === 0) esquerdaPorEnigma.set(e.id, esquerdaPorEnigma.get(e.id) + 1)
    }
  }
  if (padroes.size < 250) throw new Error('sorteio das alternativas repetiu padrão entre equipes')
  for (const [id, n] of esquerdaPorEnigma) {
    if (n < SEMENTES * 0.4 || n > SEMENTES * 0.6) throw new Error(`sorteio enviesado no enigma ${id}`)
  }
  // A correta dos respondidos tem de cair dos dois lados, sempre: nem todas à
  // esquerda nem todas à direita, em nenhuma semente.
  for (let s = 0; s < 200; s += 1) {
    const esquerda = ENIGMAS.filter((e) => e.respondido).filter((e) => ordemAlternativas(`equipe-${s}`, e.id)[0] === 0).length
    if (esquerda !== 5) throw new Error(`a correta dos respondidos ficou ${esquerda} à esquerda na semente ${s}`)
  }
}
