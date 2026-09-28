export const PDF_DRIVE_URL = ''

export const ICONE_SRC = '/tarefas/galeria-de-enigmas/icone-enigma.jpeg'
/** Capa dos enigmas já respondidos no PDF: caixa vermelha, só leitura. */
export const RESPONDIDO_SRC = '/quadrado-respondido.webp'

export const PRATELEIRA_SRC = '/tarefas/galeria-de-enigmas/prateleira.svg'

/**
 * Cenário da locadora atrás da estante: 1280x720 (16:9). O miolo do desenho é a
 * parede vazia, então a estante cai no centro sem cobrir ninguém.
 *
 * No desktop a caixa tem a proporção da arte e o `object-cover` não corta nada.
 * No celular a caixa é mais alta que a arte (4:3), aí o cover corta as pontas —
 * que é onde estão o cliente e a atendente — e sobra a parede do meio, que é
 * justamente o que serve de fundo para a estante.
 */
export const FUNDO_ESTANTE_SRC = '/desenho-fundo.jpeg'

/**
 * Extensão das capas dos 20 enigmas (`CAPA_SRC`, por id: `e11` usa `capa-11`).
 * Os arquivos em `public/tarefas/galeria-de-enigmas/capas/` são 1086x1448 (3:4, a mesma
 * proporção do `icone-enigma.jpeg` e dos tiles).
 *
 * `CAPA_EXT` precisa bater com a arte que está na pasta. Já esteve errada: valia
 * `jpg` com os arquivos em `png`, e o resultado eram 20 imagens quebradas no
 * flipped dos quadrados — passava porque o flip não era conferido com a tela
 * aberta. Se trocar a arte, confira a extensão aqui.
 */
const CAPA_EXT = 'png'

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

/**
 * Uma volta do disco, em ms. Só no modo "Mostrar Filmes", que é onde a arte com
 * disco aparece. Um DVD real gira a 300-500rpm, mas a 60fps isso vira ruído: 3,6s
 * por volta é rápido o bastante para ler como giro e lento o bastante para o olho
 * acompanhar. `linear`, sem easing — easing ficaria visível a cada volta.
 */
export const DISCO_ANIM = { voltaMs: 3600 }

/** Soma dos tempos da saída. É o que o React espera antes de desmontar. */
export const DVD_SAIDA_MS =
  DVD_ANIM.saidaCapaMs + DVD_ANIM.saidaCentroMs + DVD_ANIM.saidaParadaMs + DVD_ANIM.saidaPalcoMs

/** Virada dos tiles no botão Mostrar Filmes: duração e cascata por índice. Vale
 *  para os dois sentidos, inclusive a volta animada para o quadrado vermelho. */
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

  /**
   * Disco girando, no modo "Mostrar Filmes".
   *
   * **Por que isto é um brilho e não a arte girando.** O disco está embutido no
   * PNG da caixa — não existe arquivo separado dele. E ele não é circular: a
   * foto tem perspectiva, então o disco mede 600x540 (centro 1057, 555, medido
   * em `e16.png` com grade a cada 100px). Três tentativas, todas com emenda:
   *
   * 1. Girar a imagem inteira dentro de um clip circular: a 90° o papel da
   *    esquerda entra no meio do CD.
   * 2. Mascarar a cópia num círculo de 540 (o maior círculo que cabe no disco em
   *    qualquer ângulo): funciona, mas a 90° e 270° a borda da máscara deixa
   *    aparecer um arco da arte estática por baixo.
   * 3. Cobrir a arte estática também: precisa de uma imagem da caixa sem o disco,
   *    com o poço preenchido — que está escondido atrás do disco na foto, então
   *    não dá para recuperar.
   *
   * O que fica é o brilho especular: um `conic-gradient` girando dentro do disco.
   * Num CDlustroso é isso que o olho lê como giro, e não tem emenda nem arte
   * nova. Se um dia o disco vier como arquivo próprio (ou a caixa vier com o
   * poço preenchido), aí dá para trocar por giro de verdade — é só trocar este
   * bloco por uma `<img>` com `transform: rotate()`.
   *
   * `janela` é o disco em % do `.dvd-base`, e o clip é elíptico para acompanhar
   * a perspectiva da foto.
   */
  disco: {
    janela: { left: '52.278%', top: '26.244%', width: '41.436%', height: '49.724%' },
  },
}


export const CAPACIDADES = { 1: 7, 2: 7, 3: 6 }

export const INSTRUCAO = `Nesta tarefa, a equipe assume o balcão de uma videolocadora e organiza 20 caixas de filmes numa estante em ordem cronológica.

Cada prateleira é um bloco: a de cima recebe 7 caixas (bloco 1), a do meio 7 (bloco 2) e a de baixo 6 (bloco 3).

Passo 1 — abra cada quadrado. A caixa de DVD mostra a pergunta e duas alternativas, uma em cada papel. Não existe alternativa errada: uma vale 1 ponto e a outra vale 2. As 10 caixas vermelhas já vêm respondidas, valem 0 ponto e servem de referência — o papel da alternativa certa fica marcado, e dá para abrir e ler, mas não para escolher.

Passo 2 — escolhido o caminho dos 10 enigmas abertos, a estante se abre: arraste as caixas até ela para montar a linha do tempo. A ordem na prateleira (esquerda para a direita) é a ordem do tempo dentro do bloco. Antes de completar os 10, a estante não aceita nenhuma caixa. Três caixas já vêm fixas na estante, uma em cada prateleira, no lugar certo: servem de referência e não podem ser tiradas.

Passo 3 — “Mostrar Filmes” vira os quadrados e mostra a capa de cada filme. Abrindo um deles, o DVD aparece com o disco e o papel traz só a alternativa que a equipe escolheu, para conferir. O botão vira “Fechar Filmes”; fechando, os quadrados voltam ao desenho vermelho e dá para trocar qualquer alternativa e mostrar de novo.

Salve o rascunho quando quiser. Mesmo saindo da página, o rascunho permanece e pode ser alterado.

Quando as 20 caixas estiverem na estante (as 17 da equipe mais as 3 fixas), use “Entregar tarefa”. Depois de entregar, nenhuma alteração é possível. Só entregue quando a equipe tiver certeza.`

/**
 * Os 20 enigmas do `novos_enigmas.pdf`, na ordem do PDF (A1..A7, B1..B7,
 * C1..C6). A grade não segue esta ordem: é embaralhada por equipe
 * (`ordemGrade`). O `id` é o `eNN` do PDF e dá a capa e o disco; no PDF o C4
 * vinha como `e11` (repetido com A1) e foi corrigido para `e12`.
 *
 * Nos 10 **abertos** não existe gabarito: as duas alternativas são caminhos
 * legítimos e o que diferencia é o valor, 1 ou 2 pontos. `valorBaixo`/`valorAlto`
 * guardam os textos já com o valor certo; qual dos dois fica à esquerda é
 * sorteado por equipe (ver `ordemAlternativas`).
 *
 * Nos 10 **respondidos** existe resposta certa, e é sempre a que vale 2
 * (`VALOR_CORRETO`). O app marca o papel dela, mas não pontua: são referência.
 *
 * `bloco` + `posicao` são a letra e o número do PDF: A = prateleira 1
 * (Filmes), B = 2 (Espaços de exibição), C = 3 (Personalidades).
 *
 * `respondido: true` marca os 10 que já vêm resolvidos: capa vermelha, marca no
 * papel da correta e sem clique nas alternativas.
 *
 * `fixo: true` ("RESPONDIDA - ESTANTE" no PDF) já vem na estante, na posição do
 * gabarito, e a equipe não tira. Um por prateleira.
 */
export const ENIGMAS = [
  {
    id: 'e11',
    bloco: 1,
    posicao: 0,
    respondido: true,
    comando:
      'Sou o longa-metragem silencioso de maior projeção nacional de minha época em solo paraibano. Minhas lentes registraram os rituais da vaquejada e a brutalidade da pesca da baleia. Cruzei o oceano rumo a Paris em busca de voz e som para a modernidade, mas meu destino foi o extravio, restando ao tempo guardar apenas fragmentos de minha força visual.',
    valorBaixo:
      'entende que o filme se intitula Sob o Céu Nordestino, estreou na capital paraibana no ano de 1929 e contou originalmente com dois mil e oitenta metros de película. O filme documentário, hoje não está completo, mas mostra aspectos da Paraíba de uma forma didática.',
    valorAlto:
      'Enquanto análises tradicionais reduziam o filme ao "primitivismo" ufanista, a tese destaca uma estética "parnasiana" (formalista e cuidada) na captura de rituais como a pesca da baleia; Rodriguez aliou sensibilidade poética e rigor na composição de quadros, recusando o mero exotismo comercial.',
  },
  {
    id: 'e03',
    bloco: 1,
    posicao: 1,
    respondido: true,
    comando:
      'Nasci das inquietações de um jornalista e crítico que trocou a caneta pela câmera Bolex. Vim das lonjuras paraibanas sem dinheiro ou circuitos de exibição, mas rompi com o cinema comercial e propagandístico. Tornei-me a matriz ideológica que sacudiu o país, sendo consagrado como o verdadeiro ponto de inflexão e a síntese estética de um novo movimento nacional.',
    valorBaixo:
      'entende que o filme é Aruanda, lançado em 1960 e dirigido por Linduarte Noronha. inaugurando uma estética realista e de baixo orçamento que serviu de matriz para o Cinema Novo.',
    valorAlto:
      'compreende que o diretor fundiu o olhar jornalístico à linguagem cinematográfica para criar um cinema sociologicamente engajado; a obra é um divisor de águas pois rompeu com os documentários propagandísticos vigentes.',
  },
  {
    id: 'e07',
    bloco: 1,
    posicao: 2,
    comando:
      'Dou vida e movimento a uma comunidade remanescente que a história oficial tentou isolar no alto da serra. Trago para a tela o barro, a aridez e o cotidiano de homens e mulheres esquecidos pelo poder público. Embora eu os coloque no centro do debate social do país, as minhas imagens são mediadas por uma voz exterior que interpreta o sofrimento deles sem deixá-los falar.',
    valorBaixo:
      'a experiência de uma comunidade na Serra do Talhado, fundada pelo ex-escravizado Zé Bento, e a atividade de destaque é a produção de cerâmica (louceiras), contudo, o "modelo sociológico" limita sua autonomia, pois uma voz narradora exterior e supostamente neutra se sobrepõe às vivências dos sujeitos.',
    valorAlto:
      'compreende que o filme insere os quilombolas no debate ao denunciar o abandono político, o analfabetismo, sequelas do pós-abolição, no Nordeste. Esse é um debate social da época e, ao mesmo tempo, discute o limite dessa representação por meio do conceito de "modelo sociológico".',
  },
  {
    id: 'e15',
    bloco: 1,
    posicao: 3,
    comando:
      'A narrativa do longa-metragem de 1983 desafia abertamente a contumácia memorial de uma sociedade conservadora. De um lado, a película encena os efervescentes conflitos políticos oligárquicos que deflagraram a Revolução de 1930. De outro, o enredo resgata a subjetividade de uma mulher vanguardista, utilizando a linguagem audiovisual como um dispositivo genealógico de reparação histórica contra discursos puramente depreciativos.',
    valorBaixo:
      'Em Parahyba, Mulher Macho, a diretora Tizuka Yamazaki desloca o foco do "herói" mítico João Pessoa para fixá-lo na professora e poetisa Anayde Beiriz. A trama expõe seu romance com o advogado João Dantas, elo afetivo que desencadeou a crise política no estado.',
    valorAlto:
      'Essa reconstrução confronta o silenciamento e a exclusão da mulher na historiografia oficial paraibana. Sequências emblemáticas, como o corte de cabelo à la garçonne, materializam visualmente os ideais de independência e emancipação feminina. O cinema atua como meio crítico ao reverter o rótulo moralista e provinciano imposto pela dominação masculina da época.',
  },
  {
    id: 'e01',
    bloco: 1,
    posicao: 4,
    respondido: true,
    comando:
      'O percurso da nossa narrativa de 1942 ganha sentido nas paradas para exibições comerciais sobre as aspirinas, revelando que a modernidade mudou as condições objetivas do mercado e as condições subjetivas do indivíduo. Um de nós reage a esse processo com um entusiasmo cego e acrítico, fascinado por uma suposta superioridade intelectual dos modernos habitantes das cidades. O outro manifesta certa repulsa a essa ideia de moderno, pois traz em sua memória o horror de uma tecnologia militar mortífera que desaba como bombas do céu.',
    valorBaixo:
      'Em Cinema, Aspirinas e Urubus, o sertanejo Ranulpho fica deslumbrado com a projeção cinematográfica que mostra São Paulo como um povo destinado a cumprir uma missão civilizadora. Enquanto isso, o alemão Johann evita ao máximo falar sobre a guerra e prefere viver isolado em uma região que o senso comum considera o oposto do moderno.',
    valorAlto:
      'O choque entre os personagens evidencia que a sensibilidade moderna produz uma atmosfera de agitação e destruição de laços pessoais. Enquanto o habitante do sertão associa o progresso técnico a uma promessa de possibilidades para escapar da miséria regional, o migrante europeu percebe os perigos de que era portador do progresso técnico no quadro da civilização.',
  },
  {
    id: 'e04',
    bloco: 1,
    posicao: 5,
    respondido: true,
    fixo: true,
    comando:
      'Eu nasci para colorir o céu de Natal e arrancar sorrisos da infância na Rua Campos Sales. Mas o sopro que me inflava guardava um calor invisível e mortal. Num instante, a alegria virou fumaça, o metal cedeu à pressão e a memória de Campina Grande mudou para sempre. Um cineasta paraibano, anos depois, juntou os fragmentos desse sopro para que o tempo não apagasse o choro de José Pinheiro.',
    valorBaixo:
      'Escolha este caminho se sua equipe A obra que resgata esse acontecimento é o documentário paraibano "Os Balões de 74", dirigido por Luciano Mariz e lançado em 2007. Dando voz aos sobreviventes e familiares, o filme tensiona o silenciamento histórico sobre uma tragédia.',
    valorAlto:
      'Escolha este caminho se sua equipe A análise da obra de Luciano Mariz revela como o cinema documental atua como um instrumento de memória social contra o esquecimento institucional, transformando a dor privada em um debate público.',
  },
  {
    id: 'e17',
    bloco: 1,
    posicao: 6,
    comando:
      'O curso da nossa travessia é guiado pelo fluxo constante da água, que conecta o mar da Aldeia Alto do Tambá, o Rio Jaguaribe e o açude no Sertão paraibano. Uma força nesta jornada se manifesta na indignação contra os livros didáticos escolares, que retratam os povos originários de forma pejorativa e impõem uma narrativa oficial de apagamento. A outra força reside na oralidade e no mundo dos sonhos, onde se encontra a rara capacidade de reprogramar memórias e plantar os sinais deixados pelos antepassados.',
    valorBaixo:
      'No filme O Sonho de Anu, a protagonista Anú usa o sonho como bússola espiritual para reencontrar sua linhagem ancestral de África e do Brasil. Ela desafia a violência da escrita colonial propondo um olhar crítico à colonização a partir das vivências em territórios paraibanos.',
    valorAlto:
      'O filme celebra a ancestralidade ao provar que a memória viva, guardada pelas águas e pelas vozes que nunca se calaram, é capaz de interferir e ressignificar a história oficial. Enquanto os livros didáticos simbolizam as contradições do processo civilizatório europeu, os áudios e a voz materna tornam-se um testemunho afetivo e político de resistência cultural.',
  },
  {
    id: 'e02',
    bloco: 2,
    posicao: 0,
    comando:
      'em uma noite de festa e devoção, em 28 de julho de 1897, fui apresentado como a última grande invenção do século. Prometi trazer o progresso moderno ao iluminar uma sala escura, mas cobrei um preço que barrou a entrada do povo humilde, abrindo minhas portas apenas para os bolsos da elite parahybana.',
    valorBaixo:
      'O aparelho foi o cinematógrafo, introduzido no ano de 1897 pelo exibidor italiano Nicolau Maria Parente, na festa das Neves, mas para as camadas abastadas da sociedade paraibana.',
    valorAlto:
      'A estreia revela a contradição de uma tecnologia avançada inserida em um ambiente de contrastes sociais, pois o alto custo do ingresso restringiu o consumo à elite, gerando uma modernização excludente e segregadora.',
  },
  {
    id: 'e10',
    bloco: 2,
    posicao: 1,
    respondido: true,
    comando:
      'Afastei-me do luxo das avenidas centrais para acompanhar o crescimento da cidade em direção ao leste. Sou menor, mais simples e herdo as fitas que os palácios do centro já cansaram de exibir, mas cumpro o papel de levar a tela aos trabalhadores por poucas moedas.',
    valorBaixo:
      'Identifique que a categoria desse tipo de sala de exibição se trata dos cinemas de bairro (ou "poeirinhas"), representada pelo pioneiro Cine São João, inaugurado em Jaguaribe em 1923.',
    valorAlto:
      'compreende que a divisão espacial reflete a segregação urbana: o centro retinha os cinemas lançadores com filmes inéditos e caros para a elite, enquanto os bairros operários recebiam fitas atrasadas e baratas, hierarquizando o acesso ao lazer moderno.',
  },
  {
    id: 'e13',
    bloco: 2,
    posicao: 2,
    comando:
      'Nós somos as duas dimensões indissociáveis que dão corpo à existência de um filme e determinam sua força como documento pedagógico e histórico. A primeira de nós se manifesta na fisicalidade e no desuso tecnológico, exigindo esforços urgentes de salvaguarda química e eletrônica para que as velhas bitolas analógicas não desapareçam nas prateleiras dos arquivos universitários. A segunda de nós reside no imaterial, sobrevivendo como um testemunho estético e político capaz de projetar nos olhos de novas gerações as vestimentas, as expressões, as arquiteturas e os cotidianos esquecidos de tempos que já se foram.',
    valorBaixo:
      'Os filmes são bens materiais e imateriais simultaneamente. Diante da obsolescência tecnológica, a digitalização de acervo, como o da UFPB, salvou um patrimônio que estava inacessível ao público geral.',
    valorAlto:
      'A preservação fílmica atua diretamente na educação de resistência histórica. Ao disponibilizar a Coleção Cinema Paraibano, se democratiza o acesso e cria uma "viagem no tempo", permitindo uma expansão no repertório crítico dos jovens contra o esvaziamento provocado pela indústria cultural de massa.',
  },
  {
    id: 'e16',
    bloco: 2,
    posicao: 3,
    respondido: true,
    fixo: true,
    comando:
      'Surgi em João Pessoa no ano de 2005, batizado com o nome do filme mais emblemático da história de nossa terra. Multipliquei-me rapidamente, fincando raízes da capital ao sertão, e passei a integrar um \'boom\' nacional. Sou a principal janela que acolhe a cadeia alternativa e independente, dando vazão a obras experimentais que as grandes massas comerciais costumam ignorar.',
    valorBaixo:
      'descobriu que o evento pioneiro é o Fest Aruanda, o estado contabiliza atualmente dezessete festivais tais como o Comunicurtas (Campina Grande), Curta Coremas (Coremas), Cinema com Farinha (Patos) e Cine Congo (Congo).',
    valorAlto:
      'entende que eles funcionam como elos cruciais na cadeia produtiva ao suprir a falta de salas comerciais no estado, servindo como a única janela de difusão e exibição para filmes independentes e de circulação alternativa.',
  },
  {
    id: 'e18',
    bloco: 2,
    posicao: 4,
    respondido: true,
    comando:
      'Aventurei-me por caminhos onde as salas de exibição convencionais jamais ousaram existir, subvertendo o tradicional fluxo cultural que sempre viaja da capital para o interior. Muito além de promover o turismo e movimentar o comércio local por onde passo, tornei-me um escudo social nas mãos de pequenas comunidades, usando a arte e o compartilhamento de saberes para resgatar jovens da criminalidade.',
    valorBaixo:
      'descobriu que o fenômeno de interiorização da cultura audiovisual promovido por esses festivais que ocorrem em doze cidades, apresenta apenas 25% delas (três cidades) que possuem salas convencionais, e os três municípios citados são Congo, Coremas e Picuí.',
    valorAlto:
      'descobriu que o processo de interiorização inverte o fluxo cultural e democratiza o acesso à arte; ao promover oficinas e debates, os festivais quebram a hegemonia estética de massa e servem como ferramentas de inclusão social e enfrentamento a vulnerabilidades locais.',
  },
  {
    id: 'e20',
    bloco: 2,
    posicao: 5,
    comando:
      'Nós fomos as duas realidades do cinema independente da Paraíba. O primeiro foi o confinamento, com rolos esquecidos em prateleiras por falta de projetores. O segundo foi a libertação digital, que colocou essas imagens na internet para cineclubes e salas de aula.',
    valorBaixo:
      'O Projeto CP:MP realizou a telecinagem e disponibilização virtual de dezenas de documentários paraibanos. O acervo que antes sofria com a oxidação no NUDOC passou a abastecer pesquisas e exibições cineclubistas.',
    valorAlto:
      'A migração para o ambiente digital transforma o cinema em ferramenta de debate social nas escolas. Filmes antigos que tratam de sexualidade, questões indígenas e lutas camponesas saem do nicho acadêmico direto para os estudantes. A internet, portanto, transforma a memória audiovisual em uma prática pedagógica viva de afirmação identitária.',
  },
  {
    id: 'e19',
    bloco: 2,
    posicao: 6,
    comando:
      'Eu não exijo poltronas de veludo, pois minha mágica acontece na poeira das praças, nas comunidades rurais e nos bairros periféricos. Levo na bagagem curtas paraibanos como "O Sonho de Anu" para exibi-los diretamente nos bairros e aldeias onde foram gravados. Mostrar esses filmes para as próprias pessoas que os inspiraram prova que a tela de cinema tem o poder de devolver narrativas e criar laços de pura esperança e ancestralidade. De que movimento eu faço parte?',
    valorBaixo:
      'Escolha este caminho se sua equipe identifica iniciativas socioculturais contemporâneas, como o projeto Cine Juá (em João Pessoa e Sertão) e o Cine Derréis (em Patos), que realizam exibições gratuitas e levam a "devolutiva" de produções audiovisuais para populações que muitas vezes não têm acesso ao cinema comercial.',
    valorAlto:
      'Escolha este caminho se sua equipe compreende que a importância de ver um bom filme vai muito além do entretenimento financeiro. Assistir coletivamente a histórias sobre a própria região em espaços públicos transforma a experiência de ir ao cinema em um espelho cultural poderoso, garantindo o direito à arte, curando apagamentos históricos e cultivando um profundo sentimento de pertencimento, união e esperança popular.',
  },
  {
    id: 'e05',
    bloco: 3,
    posicao: 0,
    respondido: true,
    fixo: true,
    comando:
      'Nascido no final do século XIX, vi o cinema nascer nos braços de meu pai. Tornei-me um \'homem-equipe\' que acumulava funções para desbravar milhares de quilômetros registrando a realidade da Parahyba do Norte. Rompendo com o ufanismo comercial e a ficção, criei o verdadeiro marco zero de nossa história através de imagens silenciosas e puras do real.',
    valorBaixo:
      'para a equipe esse é o cineasta Walfredo Rodriguez, dono da produtora Nordeste Film, que estreou seu primeiro cinejornal (Filme-Jornal do Brasil – Um Pouco de Tudo) no ano de 1919 e na Parahyba do Norte buscou despertar uma identidade para o cinema paraibano.',
    valorAlto:
      'compreende que ele foi o marco zero local ao consolidar uma cinematografia fundada no real e no código documental; sua importância reside em filiar a Paraíba ao cinema de não-ficção, diferenciando-se da maioria dos ciclos brasileiros dos anos 1920, que priorizavam o gênero ficcional e "posado"',
  },
  {
    id: 'e06',
    bloco: 3,
    posicao: 1,
    comando:
      'Eu fui a pioneira que abriu as portas do cinema mudo regional no início da década de 1930. Minha trajetória como protagonista foi interrompida de forma abrupta quando a indústria cultural estrangeira impôs uma revolução tecnológica que mudou o mercado nacional.',
    valorBaixo:
      'Mazyl Jurema estreou no filme No Cenário da Vida (1930) e vivenciou o encerramento do Ciclo do Recife. Sua carreira na tela grande foi freada pela rejeição do público aos filmes mudos após a chegada do cinema sonoro estrangeiro. Isso demonstra como as rápidas transformações da mídia de massa podiam silenciar talentos pioneiros regionais sem dar espaço de adaptação.',
    valorAlto:
      'A trajetória de Mazyl expõe a extrema vulnerabilidade da mulher no mercado cultural do início do século XX. Ela foi vítima de uma exclusão forçada por fatores exclusivamente econômicos e tecnológicos, fenômeno que evidencia como as velozes transformações na mídia de massa sufocavam o pioneirismo regional.',
  },
  {
    id: 'e08',
    bloco: 3,
    posicao: 2,
    respondido: true,
    comando:
      'Eu despontei nos anos 1950 e conquistei consagração nacional no cinema, rádio e televisão. Décadas mais tarde, tomei a decisão consciente de romper com as telas comerciais por rejeitar o esvaziamento artístico e as produções apelativas da grande mídia.',
    valorBaixo:
      'Cacilda Lanuza estreou nacionalmente em O Canto do Mar (1953) e ganhou destaque na revista Cinearte. Na década de 1970, ela abandonou voluntariamente a televisão e o cinema comercial para se dedicar de forma exclusiva aos palcos.',
    valorAlto:
      'O afastamento de Cacilda representa uma postura política ativa, autônoma e de vanguarda feminina. Utilizando sua independência financeira, ela rejeitou uma mídia de massa alienante. Ao escolher os palcos, transformou o teatro em uma trincheira de resistência artística e de afirmação de sua dignidade criativa.',
  },
  {
    id: 'e12',
    bloco: 3,
    posicao: 3,
    comando:
      'Nós fomos os olhares pioneiros que capturaram as realidades profundas do povo nordestino e redefiniram os rumos da nossa cinematografia. O primeiro de nós utilizou uma câmera quase de forma documental e poética para registrar a saga de uma família negra na Serra do Talhado, revelando ao Brasil o abandono dos descendentes de escravizados e inaugurando um ciclo estético divisor de águas. O segundo de nós, partindo dessa mesma efervescência, dedicou décadas a documentar de forma contundente as lutas camponesas e a própria memória do nosso cinema, encerrando aquele ciclo áureo com uma homenagem poética feita a partir de fragmentos do passado.',
    valorBaixo:
      'As trajetórias de Linduarte Noronha e Vladimir de Carvalho evidenciam o papel transformador e de vanguarda do cinema paraibano no cenário do Cinema Novo brasileiro, deslocando o eixo temático nacional para a crueza da realidade sertaneja.',
    valorAlto:
      'Enquanto a produção de Linduarte Noronha, (Aruanda 1960) representou um marco fundador de inserção nacional por meio do curta-metragem documental de denúncia social, a atuação de Vladimir de Carvalho, (O País de São Saruê 1971), representou aprofundamento dessa estética, utilizando o documentário como uma ferramenta viva de preservação da memória histórica e de resistência política contra o apagamento cultural.',
  },
  {
    id: 'e09',
    bloco: 3,
    posicao: 4,
    respondido: true,
    comando:
      'Nós fomos os guardiões e tecelões das imagens que guardam o tempo e a história da Paraíba. O primeiro de nós, considerado o pai do cinema do nosso estado, desbravou o território nas primeiras décadas do século XX, registrando desde a flora local até os discursos e viagens do político João Pessoa, mas viu sua produção cessar e deixar apenas fragmentos perdidos no tempo. O Outro, décadas mais tarde, assumiu a missão de resgatar esses mesmos pedaços esquecidos e incorporá-los em sua própria obra cinematográfica, transformando a arqueologia de películas antigas em uma ode à resistência cultural e ao encerramento de uma era de ouro do documentário.',
    valorBaixo:
      'Vladimir de Carvalho, ao realizar o documentário O Homem de Areia (1982), utilizou estrategicamente fragmentos restantes das obras de Walfredo Rodrigues, transformando a arqueologia de películas antigas em uma ode à resistência cultural e ao encerramento de uma era de ouro do documentário.',
    valorAlto:
      'Ambas as carreiras ilustram o desafio histórico da preservação e da continuidade da memória audiovisual em solo paraibano. Enquanto Walfredo Rodrigues enfrentou a solidão do pioneirismo e a posterior escassez de produção, Vladimir de Carvalho agiu não apenas como realizador, mas como um “historiador visual”, estabelecendo uma ponte dialética entre o cinema mudo do início do século e o documentário moderno.',
  },
  {
    id: 'e14',
    bloco: 3,
    posicao: 5,
    comando:
      'Eu não busco as grandes luzes dos festivais internacionais, mas as lâmpadas improvisadas nas sedes de bairros e clubes de mães de Campina Grande. Carrego na bagagem o riso do "Major Palito" e os acordes do "Biu do Violão", fazendo com que o cinema do meu estado pertença à comunidade, e não apenas às elites. Entre as salas de aula da universidade e a poeira das ruas periféricas, divido meu tempo para que o audiovisual paraibano seja visto, debatido e, acima de tudo, lembrado por quem o inspira.',
    valorBaixo:
      'Escolha este caminho se sua equipe Refere-se ao professor e cineasta Rômulo Azevedo e ao seu projeto de extensão "Cinema de Bairro" da UEPB. Os curtas citados são "Apresentando o Major Palito & Família" e "Biu do Violão e o Diamante Cor-de-rosa".',
    valorAlto:
      'Escolha este caminho se sua equipe Sua importância está na democratização do acesso à cultura e na formação de plateia. Ao tirar os filmes dos circuitos comerciais e levá-los gratuitamente às periferias, ele descentraliza o audiovisual e transforma o cinema em uma ferramenta de emancipação e afirmação da identidade popular paraibana.',
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
  ENIGMAS.map((e) => [e.id, `/tarefas/galeria-de-enigmas/dvd-abertos-respondidos/${e.id}.png`]),
)

/** Capa de cada enigma, pelo número do id: `e11` usa `capa-11`. */
export const CAPA_SRC = Object.fromEntries(
  ENIGMAS.map((e) => [e.id, `/tarefas/galeria-de-enigmas/capas/capa-${e.id.slice(1)}.${CAPA_EXT}`]),
)

/** Os 3 enigmas que já vêm na estante, na posição do gabarito, e não saem. */
export const FIXOS = ENIGMAS.filter((e) => e.fixo)
export const FIXO_IDS = new Set(FIXOS.map((e) => e.id))

/** Enigmas que a equipe precisa escolher (os respondidos não pontuam). */
export const ENIGMAS_ABERTOS = ENIGMAS.filter((e) => !e.respondido)

/**
 * Valor da alternativa **certa** nos 10 enigmas que já vêm respondidos: é a de
 * maior peso (2). Só eles têm resposta certa — nos 10 abertos as duas
 * alternativas são caminhos legítimos e a escolha é da equipe.
 */
export const VALOR_CORRETO = 2

/** Maior sequência permitida, na ordem da grade, do 2 no mesmo lado. */
const MAX_SEQUENCIA_LADO = 2

function mulberry32(semente) {
  let a = semente
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function embaralhar(lista, rand) {
  const out = [...lista]
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rand() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

function maiorSequencia(lados) {
  let maior = 0
  let atual = 0
  lados.forEach((lado, i) => {
    atual = i > 0 && lado === lados[i - 1] ? atual + 1 : 1
    maior = Math.max(maior, atual)
  })
  return maior
}

const LADOS_CACHE = new Map()

/**
 * De que lado fica a alternativa de 2 pontos em cada enigma, por equipe:
 * `true` = esquerda. Sorteado com a semente da equipe, com três garantias que o
 * sorteio livre não dá (medido antes: algumas sementes deixavam as 10 corretas
 * dos respondidos do mesmo lado):
 *
 * - 5 à esquerda e 5 à direita nos 10 respondidos (onde o papel certo acende);
 * - 5 e 5 nos 10 abertos;
 * - na ordem em que a equipe vê a grade, o 2 nunca fica mais de
 *   `MAX_SEQUENCIA_LADO` vezes seguidas do mesmo lado.
 *
 * Alternância perfeita seria outro padrão fácil de ver, então não é isso: é um
 * embaralhamento balanceado, rejeitado e sorteado de novo enquanto houver
 * sequência longa. ponytail: rejeição com teto de tentativas; com 20 enigmas
 * acha em ~100 tentativas. Se o número de enigmas crescer muito, trocar por
 * geração com restrição.
 */
function ladosDoDois(sorteio) {
  const chave = sorteio || ''
  if (LADOS_CACHE.has(chave)) return LADOS_CACHE.get(chave)
  const grade = ordemGrade(chave)
  const rand = mulberry32(hash32(`${chave}:lados`))
  const metade = (n) => [...Array(n / 2).fill(true), ...Array(n / 2).fill(false)]
  let lados = null
  for (let tentativa = 0; tentativa < 20000 && !lados; tentativa += 1) {
    const filas = {
      respondido: embaralhar(metade(10), rand),
      aberto: embaralhar(metade(10), rand),
    }
    const seq = grade.map((e) => filas[e.respondido ? 'respondido' : 'aberto'].pop())
    if (maiorSequencia(seq) <= MAX_SEQUENCIA_LADO) lados = seq
  }
  lados ||= grade.map((_, i) => i % 4 < 2)
  const mapa = new Map(grade.map((e, i) => [e.id, lados[i]]))
  LADOS_CACHE.set(chave, mapa)
  return mapa
}

/**
 * Ordem das alternativas no DVD: índice de `VALORES` que vai no papel da
 * esquerda e no da direita. `[1, 0]` = o 2 à esquerda. Determinística: a mesma
 * semente dá sempre a mesma ordem. Ver `ladosDoDois`.
 */
export function ordemAlternativas(sorteio, id) {
  return ladosDoDois(sorteio).get(id) ? [1, 0] : [0, 1]
}

function hash32(texto) {
  let h = 2166136261
  for (const ch of texto) {
    h ^= ch.charCodeAt(0)
    h = Math.imul(h, 16777619)
  }
  h ^= h >>> 16
  h = Math.imul(h, 2246822507)
  h ^= h >>> 13
  h = Math.imul(h, 3266489909)
  h ^= h >>> 16
  return h >>> 0
}

/**
 * Ordem dos 20 quadrados na grade, embaralhada por equipe com a mesma semente
 * das alternativas. Determinística: a equipe vê sempre a mesma ordem, e a ordem
 * do `ENIGMAS` (que é o gabarito) nunca aparece na tela.
 */
export function ordemGrade(sorteio) {
  return ENIGMAS.map((e) => [hash32(`${sorteio || ''}:grade:${e.id}`), e])
    .sort((a, b) => a[0] - b[0])
    .map(([, e]) => e)
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

/*
 * `prateleiras` guarda só os enigmas móveis, em lista compacta por bloco. Os
 * fixos não entram no estado: `filaVisual` os encaixa na posição deles na hora
 * de desenhar e de pontuar.
 */

/** Quantos móveis cabem no bloco: a capacidade menos os fixos dele. */
export function capacidadeMovel(bloco) {
  return CAPACIDADES[bloco] - FIXOS.filter((f) => f.bloco === bloco).length
}

/** Quantos fixos há antes do slot visual `indice`: converte índice visual em índice móvel. */
export function fixosAntes(bloco, indice) {
  return FIXOS.filter((f) => f.bloco === bloco && f.posicao < indice).length
}

/** A prateleira como aparece: fixos na posição deles, móveis nos outros slots, em ordem. */
export function filaVisual(bloco, moveis = []) {
  const fixos = new Map(FIXOS.filter((f) => f.bloco === bloco).map((f) => [f.posicao, f.id]))
  let k = 0
  return Array.from({ length: CAPACIDADES[bloco] }, (_, i) => fixos.get(i) ?? moveis[k++])
}

export function idsAlocados(prateleiras) {
  return new Set([...FIXO_IDS, ...[1, 2, 3].flatMap((bloco) => prateleiras[bloco] || prateleiras[String(bloco)] || [])])
}

export function alocacaoCompleta(prateleiras) {
  return [1, 2, 3].every((bloco) => (prateleiras[bloco] || prateleiras[String(bloco)] || []).length === capacidadeMovel(bloco))
}

/** Gabarito da estante (só os móveis, no formato do estado): a letra e o número do PDF. */
export function gabaritoPrateleiras() {
  const next = prateleirasVazias()
  ;[...ENIGMAS]
    .sort((a, b) => a.posicao - b.posicao)
    .forEach((enigma) => {
      if (!enigma.fixo) next[enigma.bloco].push(enigma.id)
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

/** Etapa 2: 1 ponto por slot na posição certa, fixos inclusive (3 garantidos). Teto 20. */
export function calcularPontosEstante(prateleiras, teto = 20) {
  const gabarito = gabaritoPrateleiras()
  let acertos = 0
  for (const bloco of [1, 2, 3]) {
    const fila = filaVisual(bloco, prateleiras[bloco] || prateleiras[String(bloco)] || [])
    const certa = filaVisual(bloco, gabarito[bloco])
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
  if (c1.resolucao !== 20 || c1.nota !== 11.5) throw new Error('10 abertos no máximo + só os fixos devem dar 20 de resolução e nota 11,5')
  if (c2.estante !== 20 || c2.nota !== 20) throw new Error('estante cheia no gabarito deve dar 20 e nota 20')
  if (c3.estante !== 3 || c3.nota !== 1.5) throw new Error('sem resposta e sem estante sobram os 3 fixos: estante 3, nota 1,5')
  if (FIXOS.length !== 3 || new Set(FIXOS.map((f) => f.bloco)).size !== 3 || FIXOS.some((f) => !f.respondido)) {
    throw new Error('devem ser 3 fixos respondidos, um por prateleira')
  }
  for (const f of FIXOS) {
    if (filaVisual(f.bloco, [])[f.posicao] !== f.id) throw new Error(`fixo ${f.id} fora da posição`)
  }
  if (new Set(ENIGMAS.map((e) => e.id)).size !== 20) throw new Error('ids repetidos')
  const grades = new Set()
  for (let s = 0; s < 50; s += 1) {
    const ordem = ordemGrade(`equipe-${s}`).map((e) => e.id)
    if (new Set(ordem).size !== 20) throw new Error('ordemGrade não é permutação dos 20')
    grades.add(ordem.join())
  }
  if (grades.size < 50) throw new Error('ordemGrade repetiu entre equipes')
  if (ENIGMAS.length !== 20 || ENIGMAS_ABERTOS.length !== 10) throw new Error('devem ser 20 enigmas, 10 abertos')
  if (ENIGMAS.some((e) => e.bloco < 1 || e.bloco > 3)) throw new Error('bloco fora de 1..3')
  const aplicados = new Set(ENIGMAS.map((e) => `${e.bloco}:${e.posicao}`))
  if (aplicados.size !== 20) throw new Error('colocações repetidas na prateleira')
  if (alocacaoCompleta(cheio) !== true || alocacaoCompleta(prateleirasVazias()) !== false) {
    throw new Error('alocacaoCompleta quebrou')
  }
  // Lado do 2, por equipe: 5/5 nos respondidos, 5/5 nos abertos, nunca mais de
  // MAX_SEQUENCIA_LADO seguidos na ordem da grade, e variando entre equipes.
  const SEMENTES = 400
  const padroes = new Set()
  const esquerdaPorEnigma = new Map(ENIGMAS.map((e) => [e.id, 0]))
  const doisEsquerda = (s, e) => ordemAlternativas(s, e.id)[0] === 1
  for (let n = 0; n < SEMENTES; n += 1) {
    const s = `equipe-${n}`
    const seq = ordemGrade(s).map((e) => doisEsquerda(s, e))
    if (maiorSequencia(seq) > MAX_SEQUENCIA_LADO) throw new Error(`sequência longa do mesmo lado na semente ${s}`)
    for (const grupo of [ENIGMAS.filter((e) => e.respondido), ENIGMAS_ABERTOS]) {
      const esquerda = grupo.filter((e) => doisEsquerda(s, e)).length
      if (esquerda !== 5) throw new Error(`o 2 ficou ${esquerda} de 10 à esquerda num grupo na semente ${s}`)
    }
    padroes.add(seq.join())
    for (const e of ENIGMAS) if (doisEsquerda(s, e)) esquerdaPorEnigma.set(e.id, esquerdaPorEnigma.get(e.id) + 1)
  }
  if (padroes.size < SEMENTES * 0.95) throw new Error('lado das alternativas repetiu padrão entre equipes')
  for (const [id, n] of esquerdaPorEnigma) {
    if (n < SEMENTES * 0.35 || n > SEMENTES * 0.65) throw new Error(`lado enviesado no enigma ${id}`)
  }
}
