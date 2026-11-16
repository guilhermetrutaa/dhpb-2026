# Plan: ZIP dos portfólios finalistas (Glayds)

## Arquivos

| Arquivo | Motivo |
|---|---|
| `package.json` | `jszip` |
| `src/app/tarefas/portfolio-artistico/portfolioPdf.jsx` | `gerarPortfolioPdfBlob` (reuso do baixar) |
| `src/app/correcao/page.jsx` | Botão + loop de geração + ZIP |
| `docs/BUSINESS_RULES.md` | Uma linha sobre o export |

## Queries

1× `getDocs(equipes where aprovadoAte==fase_final limit 500)` no clique. Sem listener.

## Writes a preservar

Nenhum.

## Risco Spark

Até 500 reads sob demanda, só Glayds. Sem path de participante.
