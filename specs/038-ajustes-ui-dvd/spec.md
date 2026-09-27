# Spec 038 — Ajustes de UI do DVD (faixa, seleção, capa respondida)

## Problema

Cinco defeitos apontados em tela pela equipe, na Tarefa Charadas (fase 3):

1. Perguntas longas cortadas no modal. O `line-clamp-[4]` não prendia nesta caixa
   (mostrava a 5ª linha pela metade, sem elipse) e a pergunta mais longa do PDF
   (287 caracteres) ficava cortada.
2. Os rótulos `1 PONTO` / `2 PONTOS` embaixo do DVD poluíam a arte.
3. Ao escolher um caminho, o quadrado da grade continuava com a arte de
   "enigma trancado" — o sinal de "respondido" só existia para os enigmas
   marcados no PDF.
4. A faixa vermelha "Enigma já respondido — dá para ler, não dá para escolher"
   ocupava espaço e o hover das metades denunciava onde clicar.
5. Em tela larga e baixa o modal encostava no topo e no rodapé.

## Decisões

- **A fonte desce, o texto não corta.** A faixa tem 3 degraus por tamanho de
  texto (≤160, ≤230, >230 caracteres), com um degrau menor em mobile. Medido:
  1024px de faixa aceita 4 linhas a 1,6rem; 328px (celular) precisa de 1rem.
- **Sem `max-h` nem `line-clamp` na faixa.** Um teto fixo era espremido pelo
  `flex` da coluna e cortava por baixo. A altura é a que o texto precisar.
- **O palco desconta a altura real da faixa.** `ResizeObserver` mede a faixa e o
  palco 4:3 sai de `100dvh − alturaDaFaixa − 88px`. Pergunta grande encolhe o
  DVD em vez de empurrá-lo para fora da tela.
- **Largura da faixa independente da largura do palco**, para a medição da
  altura não alimentar a largura do palco e vice-versa.
- **A escolha continua nas metades do DVD**, sem rótulo e sem hover. Só a tinta
  vinho marca a escolha. O valor da alternativa não aparece em lugar nenhum.
- **Vermelho = respondido, venha ele de onde vier.** `marcado` passa a ser
  `enigma.respondido || enigmas[id].valor`. A arte vermelha é a mesma para os 10
  enigmas do PDF e para os respondidos pela equipe.

## Fora do escopo

- A arte do texto nas folhas do papel (`public/dvd-aberto.png`) e a fonte
  manuscrita não mudam.
- A geometria do DVD (`DVD_GEO`) e as 4 fases de saída não mudam.
- `persistirResposta`, pontuação, Firestore, `ORDENAR` e a estante ficam
  intactos — a escolha continua indo para `enigmas[id].valor` como antes.
- Não entra affordance nova para trocar a resposta: clicar na outra metade
  segue funcionando como já funcionava.

## Aceitação

- [x] Nenhuma das 20 perguntas fica cortada, em 1600x1100, 1366x768, 1890x900 e
      390x780. Verificado com `scrollHeight <= clientHeight` na faixa.
- [x] O modal inteiro fica dentro da viewport nessas 4 telas
      (topo >= 0 e base do palco <= altura da viewport).
- [x] Nenhum texto de ponto/valor no modal.
- [x] As metades do DVD continuam clicáveis e são as únicas formas de escolher.
- [x] Sem hover nas metades; a Escolha marcada aparece só com a tinta vinho.
- [x] A faixa vermelha de "já respondido" não existe mais.
- [x] Escolher um caminho deixa o quadrado vermelho na grade; os 10 do PDF
      continuam vermelhos.
- [x] `npm run build` passa; nenhum erro de lint novo.

## Segunda rodada

### A marca da escolha é o papel, não a metade do palco

A camada de seleção era `inset-0 grid-cols-2` sobre o palco, então a tinta
acendia em meia tela, bem maior que o papel. Agora cada botão vive **dentro** do
seu papel, no retângulo de `DVD_GEO.papel`.

Morar dentro do papel é o que torna isso barato: os dois papéis estão em
sistemas de coordenadas diferentes (o esquerdo é o verso da tampa, que viaja
com a rotação; o direito é a bandeja). Desenhar a marca do esquerdo em % do
palco exigiria compor a rotação da tampa à mão, e quebraria na hora que
alguém mexesse no `DVD_GEO`. Dentro do papel, cada botão usa o retângulo do seu
próprio pai e o navegador aplica a transformação.
Os retângulos vêm de medir a arte: papel esquerdo 190..627 × 283..851, direito
847..1271 × 277..849, em px de 1448×1086. O direito é escala pura (a imagem é
4:3 como o palco). O esquerdo passa por `background-position`, já que a tampa
desenha a imagem a 210,007% × 125,840% do elemento. A fita adesiva do papel
esquerdo fica de fora: a marca é no papel.

Rede de segurança: o retângulo de `texto` tem que cair estritamente dentro do
de `papel` nos dois lados. Hoje cai (esquerdo 25,275%..81,045% dentro de
21,465%..84,841%; direito 60,251%..86,019% dentro de 58,495%..87,847%). Se
alguém mudar a escala ou a posição da tampa e essa containment quebrar, os
números de `papel` estão errados.

### O quadrado da estante abre o DVD, e abre para ler

Clicar no quadrado de um slot ocupado abre o DVD daquele enigma. Na estante o
enigma é considerado guardado: as metades ficam travadas. Quem quiser trocar a
resposta tira com o × e responde na grade.

A régua é `somenteLeitura = respondendo || leitura`, um único nome para os dois
casos. `escolherAlternativa` passou a guardar por `somenteLeitura` em vez de
`respondendo`, para o botão desabilitado e a função não discordarem.

O quadrado da estante também segue a regra do vermelho (`marcados`), senão um
enigma que a equipe já respondeu aparece com a arte de "trancado" e parece bug.

O `stopPropagation` no clique é obrigatório: o slot fica dentro do `<button>` da
prateleira, cujo clique solta o enigma selecionado no bloco. Sem parar a
propagação, abrir o DVD também moveria um enigma. Slot vazio continua sendo
"solta aqui".

### Fora do escopo (segunda rodada)

- Arrastar de volta da estante para a grade. O caminho de volta é o ×.
- Desfazer o aninhamento de `<button>` da estante (o slot e o × são
  `role="button"` dentro do `<button>` do bloco). Já era assim antes; não é
  introduzido aqui.
- A arte de `dvd-abertos-respondidos/` continua chaveada por `enigma.respondido`
  (o PDF), não por ter resposta. Ler da estante não troca a arte.

### Aceitação (segunda rodada)

- [x] A marca ocupa ~29% da largura do palco, e não 50%; contém o texto de cada
      lado nos dois casos.
- [x] Clicar no quadrado da estante abre o DVD daquele enigma, com as duas
      metades desabilitadas.
- [x] Clicar na outra metade com o DVD da estante não troca a resposta.
- [x] O × tira da estante, e o mesmo enigma na grade volta a destravar as
      metades e aceita trocar o caminho.
- [x] Enigma respondido na estante mostra a capa vermelha; sem resposta mostra a
      arte de trancado.
- [x] Abrir da estante não move nenhum enigma (slot ocupado não vira "solta
      aqui").

## Terceira rodada

### A correta dos respondidos, e dos dois lados

Nos 10 respondidos a alternativa certa **é a que vale 1** (`VALOR_CORRETO`), e o
papel dela acende com a mesma tinta vinho da escolha da equipe — um visual só de
"respondido", nenhum carimbo novo. A arte de dois papéis continua sendo a do dia
a dia; a de disco é do modo Mostrar Filmes (abaixo).

O lado da correta **não** pode sair do hash. A média é boa (50,1%/49,9% em 2000
sementes x 10), mas ela não protege ninguém: 3 dessas 2000 sementes deixaram as
10 no lado direito e uma deixou as 10 no esquerdo. Nos respondidos a correta é
sempre a mesma, então a equipe veria o padrão. `ordemAlternativas` passou a
ignorar o sorteio nesses 10 e alternar por posição na lista de respondidos:
**5 de cada lado, sempre**, para qualquer semente. O self-check cobra isso em 200
sementes distintas.

### ORDENAR virou só um portão

Antes, ORDENAR virava os quadrados e liberava a estante. Agora ele **só** libera a
estante: nenhum desenho muda. O estado `virados` virou dois — `ordenado` (o
portão, que trava o arrasto) e `mostrarFilmes` (o desenho). Grade, estante e
fantasma do arrasto passam a olhar `mostrarFilmes`.

### Mostrar Filmes

Botão ao lado do ORDENAR, que alterna entre "Mostrar Filmes" e "Fechar Filmes".
Com ele ligado:

- os quadrados viram e mostram a capa do filme;
- abrindo um, o DVD aparece com o **disco** — a arte de
  `dvd-abertos-respondidos/`, que já traz a arte do filme no próprio CD, então
  **nenhuma capa é desenhada por fora**;
- o papel traz **só** a alternativa escolhida, num texto só, e as metades ficam
  travadas. Para trocar, fecha os filmes, troca e abre de novo.

Nas artes de disco não existe segundo papel (o lado direito é o CD), então o
texto vai no da esquerda e o outro some. O `texto.esquerda` serve para as duas
artes sem ajuste: o papel está no mesmo lugar nos dois conjuntos (medido nos 20
PNGs: `x1=628`, `y1=852`, igual ao `dvd-aberto.png`). Num respondido, que a equipe
nunca escolheu, aparece a correta.

O botão só liga depois de responder os 10 abertos, como o ORDENAR. Sem esse portão
o modo serviria para ver 20 DVDs com metade dos papéis em branco.

### Bug encontrado no caminho: as capas nunca carregaram

`CAPA_EXT` valia `jpg` com os 20 arquivos em `png`. O flip dos quadrados mostrava
20 imagens quebradas, e passou porque o flip não era conferido com a tela aberta —
os testes olhavam o `src`, não se a imagem tinha carregado. Agora verifica-se por
`naturalWidth > 0`. O próprio LEIA-ME da pasta avisava para trocar a extensão junto
com a arte.

### Aceitação (terceira rodada)

- [x] Respondido abre com os dois textos, a tinta na alternativa que vale 1, e as
      metades travadas.
- [x] A correta cai 5/5 em qualquer semente (200 sementes conferidas).
- [x] ORDENAR não muda nenhum desenho: as 20 faces da frente ficam idênticas antes e
      depois, e o arrasto para a estante destrava.
- [x] Mostrar Filmes só liga depois dos 10; vira os 20 quadrados para as capas; o
      rótulo vira Fechar Filmes; fechando, volta tudo.
- [x] Em Mostrar Filmes o DVD usa a arte de disco, o papel tem **um** texto (a
      alternativa escolhida) e as metades estão travadas.
- [x] As 20 capas carregam (`naturalWidth > 0`), sem 404.

## Quarta rodada

### A capa preenche o tile

As capas são fotos de caixa de DVD com a moldura branca em volta, e na grade
entravam inteiras: a caixa ocupava ~90% do quadrado e sobrava uma tarja clara em
volta (é o que aparece na imagem do pedido). No modal `dvd-fechado.png` não tem
esse problema porque `DVD_GEO.faceFrente` a recorta.

Medido nas 20 capas: todas têm limites **idênticos** (x 56..1034, y 114..1368) —
são da mesma sessão — então um número só serve para as 20. A caixa ocupa 90,05%
da largura e 86,60% da altura da arte. O tile é 240/312, um pouco mais largo que
a arte (3:4), então `object-cover` corta 8px da altura e sobram 216,1 de 240 e
277,1 de 312 para a caixa. Daí `CAPA_NO_TILE = scale(1.111, 1.126)`.

Precisa de `overflow: hidden` em `.dvd-vira-face`, senão a ampliação vaza para
fora do tile. A face da frente não é afetada: o zoom é só na capa.

### A tampa que gira é a capa do filme

`DvdCaixa` ganhou a prop `fechado` (default `DVD_FECHADO_SRC`). Em Mostrar
Filmes entra `CAPA_SRC[...]` do enigma, então a tampa fechada da animação já é a
capa daquele filme. O recorte de `faceFrente` foi medido em `dvd-fechado.png` e
as capas têm a mesma moldura, então o mesmo recorte serve para as duas — e a
caixa continua preenchendo a face.

### Sem quadrado de seleção em Mostrar Filmes

`escolha` passa a ser `null` no modo, então não há tinta nem clique. O modo é
para ver o que foi escolhido; para trocar, fecha os filmes. Fora do modo, os
dois botões de seleção voltam.

### Aceitação (quarta rodada)

- [x] As 20 capas preenchem o tile, sem a tarja clara (medido: `transform`
      `matrix(1.111, 0, 0, 1.126, 0, 0)`, face com `overflow: hidden`, face
      dentro do tile).
- [x] As 20 capas continuam carregando.
- [x] Abrindo e16, e03 e e20 em Mostrar Filmes, a tampa fechada da animação é
      `capa-16.png`, `capa-03.png` e `capa-20.png`; fora do modo volta a ser
      `dvd-fechado.png`.
- [x] Em Mostrar Filmes não existe nenhum `.dvd-escolha`; fora dele, voltam os
      dois.

## Quinta rodada

### ORDENAR saiu; a estante se abre sozinha

O botão ORDENAR não existe mais. O portão da estante passou a ser o próprio
`todosMarcados` — o mesmo que libera o "Mostrar Filmes" —, ou seja, os 10 enigmas
abertos respondidos. O estado `ordenado` saiu junto.

A guarda continua em `moverParaPrateleira`, então os dois caminhos (arrasto e
clique num slot) dão o mesmo aviso.

O bloqueio precisou de um ajuste no gesto: com `permitido: false`, `moverArrasto`
retornava antes do limiar de 5px, o gesto nunca virava arrasto e `soltarArrasto`
caía no "não arrastou" — que **abre o modal no meio de uma tentativa de
arrastar**, e sem aviso nenhum. Agora o gesto vira arrasto sempre; quem barra é
`soltarArrasto`, que ainda chama `moverParaPrateleira` e mostra
"Responda os 10 enigmas abertos para liberar a estante." em vermelho.

### A volta dos quadrados é animada

Tirar `.dvd-virado` só remove a animação: o `transform` computed volta a `none` e
os 20 quadrados saltavam de uma vez. Agora há `dvd-voltando`, com keyframes
próprios `dvd-virar-volta` (de `rotateY(-180deg)` a `rotateY(0deg)`) — os mesmos
tempos e a mesma cascata de `dvd-virar`, pelo mesmo motivo de `dvd-fechar`: com
`reverse` o `currentTime` anterior faria o cover pular direto para o fim.

O estado `voltando` fica ligado por `duracaoMs + 19 x staggerMs` e se apaga
sozinho, para o quadrado terminar sem transform. Também entra no bloco de
`prefers-reduced-motion`.

Como o portão exige os 10 respondidos, os 20 quadrados estão vermelhos quando o
modo fecha — a face da frente é sempre `quadrado-respondido.webp` nessa volta.

### Aceitação (quinta rodada)

- [x] Só existe o botão "Mostrar Filmes"; "Ordenar" não aparece na tela.
- [x] Com 0/10 e com 9/10, arrastar para a estante não coloca nada e mostra o
      aviso em `bg-red-100`.
- [x] Com 10/10, o mesmo arrasto coloca.
- [x] Clicar em "Fechar Filmes" roda `dvd-virar-volta`: a 200ms o transform ainda
      está em ~-178°, a 700ms é a identidade, e no fim a classe some e o
      transform é `none`.
- [x] Todas as frentes voltam a `quadrado-respondido.webp`.

## Sexta rodada

### O disco gira

No modo "Mostrar Filmes", o disco gira enquanto o DVD fica aberto. Como o modal
desmonta ao fechar, a animação morre junto — não há estado para limpar.

**O que não dá para fazer, e por quê.** O disco não é um arquivo: está embutido
no PNG da caixa, e a foto tem perspectiva, então ele é elíptico (600×540, centro
1057, 555, medido em `e16.png` com grade a cada 100px). Três tentativas, todas
com emenda:

1. Girar a imagem inteira num clip circular — a 90° o papel da esquerda entra no
   meio do CD.
2. Mascarar a cópia num círculo de 540 (o maior círculo que cabe no disco em
   qualquer ângulo) — funciona, mas a 90° e 270° a borda da máscara deixa
   aparecer um arco da arte estática por baixo.
3. Cobrir também a arte estática — exige uma imagem da caixa **sem** o disco, com
   o poço preenchido, e o poço está escondido atrás do disco na foto, então não
   dá para recuperar.

**O que ficou.** Um brilho especular: duas faixas `conic-gradient` (larga e
estreita, defasadas) girando dentro de um clip elítico sobre o disco, com
`mix-blend-mode: screen`. Num CD lustroso é isso que o olho lê como giro, e não
tem emenda nem arte nova. Uma volta a cada 3,6s (`DISCO_ANIM.voltaMs`): um DVD
real gira a 300-500rpm, mas a 60fps isso vira ruído.

As duas faixas completam a volta no mesmo tempo — num disco real estão no mesmo
corpo rígido. A profundidade vem da diferença de largura e ângulo, não da
velocidade.

O clip é **elíptico** para acompanhar a perspectiva. Num brilho gerado isso não
importa (não há arte para girar), ao contrário do giro de verdade.

Se um dia o disco vier como arquivo próprio, ou a caixa vier com o poço
preenchido, dá para trocar por giro real: é só substituir as faixas por uma
`<img>` com `transform: rotate()`. O resto (`janela`, o clip, o gating) não muda.

### Aceitação (sexta rodada)

- [x] Em Mostrar Filmes a janela existe, com duas camadas de brilho rodando
      (`dvd-girar-disco`, 3,6s) e clip `50% / hidden`.
- [x] A janela sai nos valores medidos: 52,28% / 26,24% do palco, 41,436% x
      49,724% — medido no browser em 456x410 numa base de 1100x825, proporção
      1,11 = 600/540.
- [x] Sem emenda em 0°, 90°, 180° e 270°: a arte do disco fica idêntica e só o
      brilho muda de lugar.
- [x] Fora do modo a janela não existe.
- [x] `prefers-reduced-motion` desliga o brilho.

## Sétima rodada

### Cenário da locadora atrás da estante

A área da estante passou a ter o cenário `public/desenho-fundo.jpeg` (1280×720,
16:9) atrás. O miolo do desenho é a parede vazia, então a estante cai no centro
sem cobrir ninguém, e o cliente e a atendente ficam dos lados.

O `prateleira.svg` é linha com `fill="none"` e sem nenhum `<rect>`, então não tem
fundo próprio para cobrir a cena — dá para usar o SVG como está.

**A caixa é 16:9 no desktop e 3:4 no celular. Não é estética: com 16:9 no
celular a estante fica com 18px de slot, inutilizável para arrastar. Com 3:4 o
`object-cover` corta as pontas da arte — que é onde estão as personagens — e sobra
a parede do meio, que é justamente o que serve de fundo. Medido: o slot do
celular foi de 18×24 para 32×43.

**A estante é dimensionada pela ALTURA da caixa** (`h-[88%]`), nunca pela
largura, para não estourar a cena; os slots crescem junto com a caixa.

**O brilho radial atrás dela é funcional, não decorativo.** A arte da estante é
preta e a parede é terracota escura: sem luz a estante some no fundo, e os slots
vazios tracejados ficam ilegíveis.

O aviso de capacidade de bloco saiu para fora da cena, para ficar sobre o fundo
claro da página e continuar legível.

### Um bug que a captura pegou

O brilho e a placa entraram como irmãos da estante no mesmo flex, então viraram
**colunas ao lado** dela e a empurraram para a direita, com o brilho à esquerda.
Saiu no screenshot, não no código. Os dois foram para `absolute` e a estante ficou
sendo a única filha no fluxo — é ela que centraliza.

### Aceitação (sétima rodada)

- [x] O cenário aparece atrás da estante, sem 404 (`naturalWidth` 1280).
- [x] A estante e a placa ficam centralizadas no miolo da arte.
- [x] Slot utilizável no celular: 32×43 (era 18×24).
- [x] A estante não estoura a caixa em 1600×1100, 1366×768 e 390×780.
- [x] Arrastar para a estante e o portão dos 10 continuam funcionando; abrir o
      enigma da estante também.

## Oitava rodada — cenário de ponta a ponta

O cenário deixou de ter `max-w` e passou a encostar nas duas bordas da página.

**O que travava não era o `max-w` do cenário.** A cena estava dentro do
`div mx-auto mt-10 max-w-5xl px-4` da grade, que corta em 992px dentro de uma
página de 1600. Tirar o `max-w` do próprio cenário não mudou nada — foi medido:
a caixa continuou em 992 e o slot em 39×53, igual. A correção é **mover a cena
para fora daquele container**, para ela ser filha direta da `section`, que é
larga e não tem padding horizontal. Aí `w-full` já é a largura da página.

**Nada de `w-screen`.** A técnica usual de sangria é
`w-screen left-1/2 -translate-x-1/2`, mas 100vw inclui a barra de rolagem
vertical, e como a página é longa ela está sempre presente: apareceria rolagem
horizontal. `w-full` dentro da `section` dá o mesmo resultado sem o efeito
colateral. Medido: `scrollWidth === innerWidth` em 2560, 1600, 1366 e 390.

A estante cresceu junto, porque é dimensionada pela ALTURA da caixa. Slots:

| Tela | Cena | Estante | Slot |
|---|---|---|---|
| 2560 | 2560×1440 | 992×1239 | 106×141 |
| 1600 | 1600×900 | 611×764 | 65×87 |
| 1366 | 1366×768 | 519×648 | 55×74 |
| 390 | 390×520 | 333×417 | 36×47 |

Antes o slot era 39×53 no desktop e 18×24 no celular. Em nenhum tamanho a
estante estoura a cena.

O aviso de capacidade de bloco ficou fora da cena, sobre o fundo claro, e ganhou
`px-4` para não encostar na borda.

### Aceitação (oitava rodada)

- [x] O cenário encosta nas duas bordas: `left = 0` e `right = innerWidth` em
      2560, 1600, 1366 e 390.
- [x] Sem rolagem horizontal em nenhum desses tamanhos.
- [x] A estante não estoura a cena em nenhum deles.
- [x] Arrastar para a estante, o portão dos 10 e abrir o enigma da estante
      continuam funcionando depois de mover o nó no DOM.
