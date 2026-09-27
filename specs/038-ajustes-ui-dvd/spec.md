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
