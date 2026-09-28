# Spec: Novos enigmas da tarefa Charadas (`novos_enigmas.pdf`)

| Campo | Valor |
|---|---|
| Slug | `040-novos-enigmas-charadas` |
| Status | implementada |
| Firebase | principal |

Troca os 20 enigmas da spec 037 pelos do `public/novos_enigmas.pdf`, embaralha a grade por equipe e fixa 3 enigmas respondidos na estante.

## Decisões humanas

- Prateleira 1 = A (Filmes, 7), 2 = B (Espaços de exibição, 7), 3 = C (Personalidades, 6). Letra = prateleira, número = posição.
- "Item de 1,0 ponto" = `valorBaixo` (1), "Item de 2,0 pontos" = `valorAlto` (2).
- Cada enigma usa o `eNN` e a `capa-NN` indicados no PDF. C4 vem no PDF como `e11` (repetido com A1); corrigido para **`e12`**.
- 10 "RESPONDIDA" (correta = a que vale **2**, marcada em vermelho). Os 3 "RESPONDIDA - ESTANTE" (A6 `e04`, B4 `e16`, C1 `e05`) ficam **fixos** na posição do gabarito e não saem.
- Os fixos **contam** na estante: 3 pontos garantidos, teto continua 20.
- A grade é **embaralhada por equipe**, a partir da mesma semente `sorteio` das alternativas.
- Lado do 2 sorteado por equipe sem padrão: na ordem da grade, no máximo 2 seguidos do mesmo lado; 5/5 esquerda-direita entre respondidos e entre abertos.

## Escopo negativo

Não altera animação, transação, dual-write, `entregue` imutável, rotas, schema do Firestore ou a fórmula da nota (média de resolução e estante).

## Firestore

Nenhuma leitura/escrita nova. `prateleiras` continua guardando só os enigmas móveis (os fixos são descartados ao ler), então o schema não muda.

## Required reading

1. `specs/037-enigmas-tarefa-pdf/spec.md`
2. `public/novos_enigmas.pdf`
3. `src/app/tarefas/charadas/config.js`
4. `src/app/tarefas/charadas/page.jsx`

## Critérios de aceite

- [x] Os 20 textos e 40 caminhos do PDF no `config.js`, com bloco/posição pela letra/número
- [x] Capa e disco de cada enigma pelo `eNN` do PDF
- [x] Grade em ordem diferente por equipe, estável entre recargas
- [x] e04, e16 e e05 já na estante desde o início, sem × e sem aceitar soltar em cima
- [x] Estante completa = 17 móveis; nota da estante conta os 3 fixos
- [x] Textos longos (até 651 caracteres) sem corte na faixa e nos papéis — medido no DOM em 980x914 e 375x720
- [x] Respondidos marcam a alternativa de 2; lado do 2 sem sequência > 2 (self-check em 400 sementes)
- [x] `node --no-warnings scripts/simular-pontuacao-charadas.mjs` confere a nota (fixos + aleatórios)
- [x] Self-check do config passando; `npm run build` código 0
