# Plan: Modal cabe na tela, saída pelo centro, estante só depois do ORDENAR (fase 3)

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/tarefas/charadas/page.jsx` | `larguraModal`, `desvioFechado`, faixa com `line-clamp`, `gesto.permitido`, guarda em `moverParaPrateleira`, cor da mensagem, cursor do tile, `INSTRUCAO` |
| `src/app/globals.css` | `@keyframes dvd-apagar`; `dvd-sair` com `scale()` antes de `translateX()`; reduced-motion |
| `src/app/tarefas/charadas/config.js` | `INSTRUCAO` na ordem nova (marcar → ORDENAR → estante) |
| `specs/034-faixa-saida-ordenar/spec.md` | origem da faixa, da saída e do ORDENAR |

## Largura derivada da altura

`larguraModal` é uma string CSS no JSX, não uma classe: `min()` com três termos (`96vw`, `1100px` e o termo da altura) não cabe numa classe `w-[…]` do Tailwind sem ficar ilegível. O termo da altura aparece duas vezes, `100vh` e `100dvh`, para o navegador que não conhece `dvh` usar o primeiro.

O palco continua com `aspect-ratio: 1448 / 1086` no CSS, então a largura calculada é a única alavanca: o 4:3 vem de graça e a fonte (`cqw`) e a perspectiva (`170cqw`) acompanham.

`13.5rem` é a reserva para fora do palco. Para não depender do texto, a faixa ganha `line-clamp-[3]` e fonte com teto menor (`1.6rem`), o que torna a reserva válida mesmo com pergunta longa.

## Trava da estante

Duas portas, porque são dois gestos diferentes:

- **arrasto** — `iniciarArrasto` sempre registra o gesto (senão `soltarArrasto` não distinguiria clique de arrasto e o clique deixaria de abrir o DVD) e grava `permitido: virados`. `moverArrasto` só ativa o arrasto se `permitido`. Antes do ORDENAR o cursor é `pointer` e soltar abre o DVD normalmente.
- **clique na prateleira** — guarda no topo de `moverParaPrateleira`, que é o único ponto de entrada das duas vias.

A mensagem de bloqueio começa com “Use o botão”, então entrou no teste que decide a cor do balão (`text-red-800` vs `text-green-800`).

## Queries

Nenhuma leitura nova.

## Writes a preservar

`persistirResposta` intacta: `runTransaction`, dual-write, rascunho com `delta = 0`, entrega com `increment`, `entregue` imutável.

## Auth e UI

- `authUser.uid` + membro `ativo`; sem alteração.
- `useSearchParams` continua no `<Suspense>`.
- Nenhum URL novo, logo nenhum `optimizeCloudinaryUrl`.

## Risco Spark

Nenhuma leitura ou escrita nova. `virados` é estado de tela; a trava da estante é só UI — o Firestore não sabe que ela existe.

## Docs a atualizar

Nenhum. Rota, schema e regras de negócio inalterados.
