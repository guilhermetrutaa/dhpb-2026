# Plan: Saída do DVD em três tempos (fase 3)

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/globals.css` | `dvd-centro` + `dvd-sai` no mesmo elemento; `dvd-sai` com `forwards` |
| `src/app/tarefas/charadas/config.js` | `saidaCentroMs`, `saidaParadaMs`; `DVD_SAIDA_MS` derivado |
| `src/app/tarefas/charadas/page.jsx` | exporta as 4 custom properties; `setTimeout` usa `DVD_SAIDA_MS` |

## Por que só CSS e nada de estado

Nenhuma fase precisa de estado: a ordem e as pausas são `animation-delay`. O React só precisa saber quanto tempo esperar antes de desmontar, e esse número sai do próprio config (`DVD_SAIDA_MS`) para não divergir do CSS.

## Duas animações, um elemento

`dvd-centro` cuida do `translateX` e `dvd-sai` da `escala` + `opacity`. A última da lista tem prioridade, então `dvd-sai` só pode entrar depois de `dvd-centro` ter entregado o valor final — daí o `forwards` (sem *backwards fill*, que publicaria o `from` já centralizado e mataria a travessia).

## Queries

Nenhuma leitura nova.

## Writes a preservar

Nenhum write. A correção é CSS + um `setTimeout`.

## Risco Spark

Nenhum: nenhuma query, nenhum write, nenhuma dependência.

## Docs a atualizar

Nenhum. Rota, schema e regras de negócio inalterados.
