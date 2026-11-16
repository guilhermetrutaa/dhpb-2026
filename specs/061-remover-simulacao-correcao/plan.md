# Plan: Remover simulação local da correção

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/correcao/page.jsx` | Tira `sim`, `isLocalDevHost`, ramos mock |
| `src/app/correcao/mock.js` | Apagar |

## Queries

Nenhuma nova. Localhost passa a usar as queries já especificadas.

## Writes a preservar

`salvarCorrecao`, `salvarVeredito`, `gravarNota`, `acrescentarTerceiro` — sem ramo mock.

## Risco Spark

Zero em produção. Em localhost o corretor passa a consumir a cota real (esperado).
