# Spec: Fase encerrada na Sala de prova

| Campo | Valor |
|---|---|
| Slug | `054-fase-encerrada-sala` |
| Status | implementada |
| Firebase | nenhum |

## Problema / valor

Na Sala de prova, equipe que não foi para a final vê "Aguardando resultados..." na Fase 4 já encerrada. O rótulo deve dizer só que a fase encerrou.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)
- [ ] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera: `aprovadoAte`, pontuação (`ni`/`di`/`df`), `questao`, `membro-index`, bloco de encaminhamento da spec 050, rótulo de finalista, rótulos das Fases 1–3.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Fase 4 `finalizada`, equipe parou nela (`aprovadoAte` ≠ `fase_final`) | "Aguardando resultados..." (a fase seguinte fica pendente, ou o resultado da final não foi publicado) | "Fase encerrada." |
| Fase 4 `finalizada`, `aprovadoAte === 'fase_final'` | "Aguardando resultados..." até publicar; depois "Participou e foi aprovada." | Igual |
| Fases 1–3 e "Equipe eliminada na Fase N." | Textos atuais | Iguais |

## Firestore

**Leituras:** nenhuma nova. A sala já lê `edicoes.resultadoFinalPublicado` e as fases.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `specs/050-finalizacao-fase4-encaminhamento/spec.md`
4. `src/app/sala-de-equipe/page.jsx`
5. `src/lib/support/ai/knowledge.js`

## Critérios de aceite

- [x] Fase 4 `finalizada` e equipe não finalista que parou nessa fase: rótulo "Fase encerrada."
- [x] Finalista na Fase 4 antes da publicação: continua "Aguardando resultados..."
- [x] Fases 1–3 e "Equipe eliminada na Fase N." inalterados
- [x] Chat lista "Fase encerrada." entre os status da sala
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança (rota e schema iguais)

## Princípios da constitution aplicáveis

Free Tier (zero leitura nova). Diff mínimo. Sem write em `aprovadoAte`.
