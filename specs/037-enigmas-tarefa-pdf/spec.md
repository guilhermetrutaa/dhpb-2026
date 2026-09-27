# Spec: Enigmas reais do TAREFA.pdf (fase 3)

| Campo | Valor |
|---|---|
| Slug | `037-enigmas-tarefa-pdf` |
| Status | implementada |
| Firebase | principal |

Troca os 20 enigmas fictícios pelos textos oficiais do `public/TAREFA.pdf` e troca o modelo de pontuação das alternativas.

## Problema / valor

Até aqui a tarefa rodava com 20 enigmas de placeholder ("Charada N, em que período este registro se encaixa?"), gabarito de alternativa A/B e pontuação só da estante. O `TAREFA.pdf` é o enunciado oficial: traz os 20 enunciados, os dois caminhos de cada um, a coluna "Colocação na prateleira" e a regra de nota. Além disso, o `dvd-aberto.png` foi **trocado**: antes tinha papel pautado num painel só; agora são dois papéis colados, um em cada painel, e é neles que a alternativa é escrita.

## Decisões humanas

- **Não existe gabarito.** As duas alternativas são caminhos legítimos; o que difere é o valor: uma vale 1 ponto, a outra 2. No PDF saem como 0,5 e 1,0 — corrigido para 1 e 2.
- **A Fundamentação não aparece** para as equipes (e não é usada para nada).
- **A ordem das alternativas é sorteada por equipe**, para o par 1/2 não ficar sempre do mesmo lado.
- **Não entra** o "fechar enigma" individual com a caixa ficando vermelha: continua o rascunho/entrega da tarefa inteira.

## Escopo negativo

Não altera a animação 3D de abertura/fechamento, o arrasto para a estante, o ORDENAR, a transação, o dual-write, `entregue` imutável, rotas ou a fórmula `Di = Ni × peso`. Não instala dependências.

## As-is vs to-be

| Regra | Antes (036) | Depois |
|---|---|---|
| Enigmas | 20 placeholders | 20 textos do PDF, com `comando`, `valorBaixo`, `valorAlto` |
| Gabarito | `opcaoCorreta: "A" \| "B"` | **removido** — não existe alternativa certa |
| Escolha | `enigmas[id].opcao: "A" \| "B"` | `enigmas[id].valor: 1 \| 2` |
| Rótulo da metade | "Opção A" / "Opção B" | "1 ponto" / "2 pontos" — é a informação que importa |
| Posição das alternativas | A à esquerda, B à direita, fixo | sorteada por equipe via `ordemAlternativas(semente, id)` |
| Gabarito da estante | derivado de `bloco`/`ordemNoBloco` inventados | coluna "Colocação na prateleira" do PDF (1–20) |
| Pontuação | 1 ponto por slot, teto `fase.tarefa.pontuacao` | média simples de `resolução` (soma dos valores, máx. 20) e `estante` (slots certos, máx. 20) |
| Enigma respondido | não existia o conceito | 10 dos 20 (3, 6, 7, 9, 10, 13, 14, 16, 17, 18) |
| Capa do respondido | `?` igual aos outros | `public/quadrado-respondido.webp` (caixa vermelha) |
| Respondido: alternativas | clicáveis | **`disabled`**, com faixa "já respondido — dá para ler, não dá para escolher" |
| Respondido: DVD | o mesmo `dvd-aberto.png` | `dvd-abertos-respondidos/{id}.png` |
| Texto no DVD | chosen, no papel pautado (1 painel) | **as duas** alternativas, nos dois papéis, em letra de mão |
| ORDENAR exige | 20 com A/B | os 10 **abertos** com caminho escolhido |
| Fonte do papel | Poppins | `public/BryndanWriteBook.ttf` via `next/font/local` |

## Geometria (remedida, o PNG mudou)

O `dvd-aberto.png` novo tem dois papéis colados. Medido por máscara de corrida mínima (senão o brilho do plástico entra):

- **lombada**: as duas costuras do painel estão em **708px** e **756px**, que espelham em 732px. `eixoX: 50.518%` continua valendo — é a mesma dobra medida antes.
- **papel esquerdo** `190..627 x 283..851` (verso da tampa, dentro da folha)
- **papel direito** `847..1271 x 277..849` (bandeja, dentro do frame)
- A caixa de texto ocupa 88% da largura e 80% da altura de cada papel, centralizada.

Dois sistemas de coordenadas, e isso é a armadilha: `texto.direita` é % do frame (`.dvd-base` é `inset: 0` do palco), mas `texto.esquerda` é % **da folha** (que é 79,65% da altura do frame). Guardar o mesmo número nos dois dá caixa de altura negativa.

**`right`/`bottom` em CSS são distância a partir da borda oposta.** Guardar a caixa como coordenada (`right: 85.7%` querendo dizer "a borda está em 85,7%") soma em vez de subtrair e dá largura negativa: `left: 60.5%` + `right: 85.7%` = −509px → caixa 0×0. Por isso as caixas são `left/top/width/height`.

**`line-clamp` quebra o absoluto posicionado.** Ele emite `display: -webkit-box`; o `getComputedStyle` reporta `flow-root` e a resolução de `width`/`height` de um abspos vai a 0. Como a caixa já tem `top` e `height` fixos, `overflow: hidden` sozinho corta o excedente.

## Calibração da letra

A altura do texto cresce com o **quadrado** do tamanho da fonte. Medido no DOM (não estimado), com o texto mais longo do enunciado — **257 caracteres, `e03`**:

| Fonte | Altura do texto | Caixa | Folga |
|---|---|---|---|
| 2,4 cqw | 412px | 348px | **−64px, corta** |
| 2,2 cqw | 348px | 348px | 0, no limite |
| **2,1 cqw** | **305px** | **348px** | **+43px** |

Cabe nas 4 telas testadas (1600×1100, 1366×768, 820×1180, 375×720) porque caixa e fonte escalam juntas em `cqw`. No celular a letra fica com 7,5px: pequena, mas o texto inteiro — que era a alternativa a cortar.

Medir com `scrollHeight` não vale: `overflow: hidden` clampa o valor. O check clona o elemento com `overflow: visible` e `height: auto`.

## Sorteio por equipe

FNV-1a + o finalizador `fmix32` do murmur3. O FNV-1a sozinho **não servia**: o bit baixo é fraco, saía um padrão quase alternado (deduzível) e sementes diferentes caíam na mesma ordem — `s1` e `s3` davam a mesma string. Com o finalizador: **400/400 padrões distintos** e divisão 49,7%/50,3%, verificado no self-check do config.

A semente vem do rascunho salvo e, sem ele, deriva do `equipeId`. **Não usa `Math.random`**: precisa ser igual no servidor e no cliente (hydration) e não pode mudar entre recargas, senão o par 1/2 trocaria de lado sozinho.

## Pastas de imagem

- `public/tarefas/charadas/dvd-abertos-respondidos/` — 10 PNGs (`e03.png`…`e18.png`) + `LEIA-ME.md`. **São cópias do `dvd-aberto.png`**, para não dar 404 até a arte chegar. O LEIA-ME exige 4:3 e a lombada na mesma posição relativa (costuras em 708 e 756 de 1448px), senão a tampa fecha deslizando.
- `public/tarefas/charadas/capas/` — as capas do ORDENAR, já provisórias (spec 034).

## Firestore

**Leituras/writes:** nenhuma nova. `persistirResposta` mantém `runTransaction`, `increment`, dual-write, rascunho com `delta = 0` e `entregue` imutável. A nota é a média das duas etapas, então `peso` continua sendo a nota da fase e `Di = Ni × peso` não muda.

**Schema alterado** (documentado em `docs/DATABASE.md`): `enigmas` passa de `{ opcao: "A" | "B" }` para `{ valor: 1 | 2 }`; entram `sorteio`, `pontosResolucao` e `pontosEstante`. Rascunhos antigos com `opcao` são lidos como enigma sem valor (0 pontos) — a tarefa ainda não foi publicada.

## Required reading

1. `specs/036-saida-tres-tempos/spec.md`
2. `public/TAREFA.pdf`
3. `src/app/tarefas/charadas/config.js`
4. `src/app/globals.css`
5. `public/tarefas/charadas/dvd-abertos-respondidos/LEIA-ME.md`

## Critérios de aceite

- [x] Os 20 enunciados e os 40 caminhos do PDF no `config.js`, sem placeholder
- [x] Gabarito da estante = coluna "Colocação na prateleira": 1–7 / 8–14 / 15–20
- [x] Sem gabarito de alternativa: grava-se o **valor** (1 ou 2)
- [x] `resolução` = soma dos valores dos 10 abertos, teto 20; `estante` = slots certos, teto 20; nota = média
- [x] Os 10 respondidos com capa vermelha, alternativas desabilitadas e faixa de aviso
- [x] Cada respondido abre o seu `dvd-aberto` da pasta nova
- [x] Os dois textos nos dois papéis, na Bryndan Write
- [x] Nenhum texto cortado nos 4 tamanhos de tela, inclusive o de 257 caracteres
- [x] Rótulos das metades mostram o valor ("1 ponto" / "2 pontos")
- [x] Ordem das alternativas varia por equipe, 400/400 padrões distintos
- [x] A mesma equipe mantém a ordem entre recargas
- [x] ORDENAR exige os 10 abertos marcados
- [x] `next/font/local` carrega `public/BryndanWriteBook.ttf`
- [x] Sem 404 e sem erro de console
- [x] `npm run build` código 0
