# Spec: Saída do DVD em três tempos (fase 3)

| Campo | Valor |
|---|---|
| Slug | `036-saida-tres-tempos` |
| Status | implementada |
| Firebase | principal |

Correção pontual da saída definida na `035-modal-altura-saida-centro`.

## Problema / valor

A `035` deslocava a caixa fechada para o meio **e** a fazia sumir ao mesmo tempo. Medido com o relógio da página: quando a caixa chegava ao centro a opacidade já estava em **0,07** — a chegada ao meio nunca aparecia. O pedido original era "fecha, vai para o meio da tela **e depois** sai", ou seja, três tempos, não dois.

Pior: na primeira tentativa de separar em três tempos, a caixa **pulava** direto para o meio e a travessia sumia. Ver causa abaixo.

## Escopo negativo

Só a animação de saída. Não altera a abertura, a faixa da pergunta, as opções A/B, o arrasto, o ORDENAR, a estante, `persistirResposta`, o schema, rotas ou regras de negócio.

## As-is vs to-be

| Regra | Antes (035) | Depois |
|---|---|---|
| Fases da saída | 2 tempos: capa (520ms) → encolher+sumir (480ms) | **4 tempos**: capa (480ms) → ir ao meio (400ms) → parada (80ms) → encolher e sumir (260ms) |
| Chegar ao meio | opacidade 0,07, invisível | opacidade 1, escala 1: a chegada aparece |
| Travessia | — | visível, de `+221px` até `0px` do centro |
| `dvd-sair` | uma animação só | `dvd-centro` (translate) + `dvd-sai` (escala + opacidade) no mesmo elemento |
| `fill-mode` de `dvd-sai` | `both` | **`forwards`** |
| Total | 1000ms | 1220ms (`DVD_SAIDA_MS`, derivado no config) |

## A armadilha do `fill-mode`

Duas animações no mesmo elemento: a última da lista tem prioridade. `dvd-sai` tem `delay: 960ms` e seu `from` já vem **centralizado** (é o `to` de `dvd-centro`). Com `fill-mode: both`, o *backwards fill* publica esse `from` durante os 960ms de atraso — então a caixa aparece no meio desde o primeiro frame e a travessia nunca acontece. Medido: `dentro 12px do centro com opacidade 1` já em 355ms, quando a tampa ainda estava fechando.

Com `forwards` a animação não contribui nada antes de começar, `dvd-centro` (que tem `both`) fica no comando durante a travessia, e a emenda não salta porque o `from` de `dvd-sai` é exatamente o `to` de `dvd-centro`.

## Ordem das funções de `transform`

`scale(0.24) translateX(−24,33%)`, nunca o inverso. Na ordem invertida o `translateX` é somado depois de a escala já ter puxado a caixa para perto do centro e ela passa direto por ele (medido: terminava 164px fora).

## Tempos

```js
saidaCapaMs: 480,    // a tampa fecha
saidaCentroMs: 400,  // a caixa fechada atravessa até o meio, opaca
saidaParadaMs: 80,   // batida parada no meio
saidaPalcoMs: 260,   // encolhe e some
```

`DVD_SAIDA_MS` é a soma dos quatro, exportado do config e usado no `setTimeout` do React — o tempo do JS não pode divergir do CSS.

## Firestore

Nenhuma. É só CSS e um `setTimeout`.

## Critérios de aceite

- [x] Quatro tempos encadeados, sem emenda visível
- [x] A caixa fechada chega ao centro com `opacity: 1` e `escala: 1`, e **fica** lá durante a parada
- [x] A travessia é visível: de +221px a 0px do centro
- [x] O sumiço só começa depois da chegada
- [x] `prefers-reduced-motion` fecha na hora
- [x] Nada mais mudou no modal
- [x] Sem erro de console
- [x] `npm run build` código 0
