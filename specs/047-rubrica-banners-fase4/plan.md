# Plan: Rubrica nova da correção do portfólio (fase 4)

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/lib/criterios.js` | Textos, pesos, bloco Reflexão histórica, `RUBRICA` |
| `src/lib/correcao.js` | `docDaRubrica` descarta doc antigo em `mesclarCorrecao` e na leitura |
| `src/lib/correcao-firestore.js` | Veredito grava `rubrica` |
| `src/app/correcao/page.jsx` | Fila, veredito e rascunho só da rubrica vigente; instrução de Referências |
| `docs/BUSINESS_RULES.md`, `docs/DATABASE.md`, `docs/KNOWN_ISSUES.md` | Schema e o peso antigo que permanece |

## Queries

Nenhuma query nova. Path do participante: 0.

## Writes a preservar

`gravarNota` inalterado. Dual-write de `peso` só quando um veredito novo fecha.

## Risco Spark

O mesmo da spec 046. Descarte da rubrica antiga não acrescenta leitura.
