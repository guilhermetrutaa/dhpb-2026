# Plan: Sistema de pontuação e eliminação por fases

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/questao/page.jsx` | `Di = Ni × peso` na transação de entrega |
| `src/lib/eliminacaoFases.js` | Funções puras: rede, desempate, cortes F1–F5 |
| `src/app/admin/ranking/page.jsx` | Preview + confirmação; tabela com 2 casas |
| `src/app/admin/dashboard/page.jsx` | Hint peso / nota máxima |
| `src/app/regulamento/page.jsx` | Itens 5.4–5.6, 5.14, 5.19 |
| `src/lib/support/ai/knowledge.js` | Mesmos números para o bot |
| `docs/BUSINESS_RULES.md` | Fórmula e funil |
| `docs/DATABASE.md` | Schema de `di` / `peso` / `notaMaxima` |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`. Ranking: `getDocs(equipes where edicaoId == …)` já existente (scan admin justificado).

## Writes a preservar

Transação de entrega e dual-write (`equipes/{id}/pontuacoes/{faseId}` + `equipes.pontuacoes` / `equipes.df`) permanecem. Aprovação só atualiza `aprovadoAte` em batch.

## Auth e UI

- Ranking e dashboard: `admin-authenticated` no `localStorage` (padrão admin atual).
- `useSearchParams`: ranking já está em `<Suspense>`.
- Sem Cloudinary novo.

## Risco Spark

1ª fase (set/2026): writes de entrega iguais aos de hoje (1 transação / questão). Preview não lê de novo. Confirmação: até ~1 write por equipe aprovada (batches de 400). Sem recálculo de `df`.

## Docs a atualizar

`docs/BUSINESS_RULES.md`, `docs/DATABASE.md`. Sem nova rota.
