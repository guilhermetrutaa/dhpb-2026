# Spec: Completas com 4 ou mais membros no admin

| Campo | Valor |
|---|---|
| Slug | `017-admin-completas-quatro-ou-mais` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

Equipes que bugaram e ficaram com mais de 4 membros no Firestore não entram nos totais da aba Equipes nem no texto de “Copiar resumo das completas”, porque a regra olha só os slots `membros[0]`…`[3]`. Completa passa a ser 4 ou mais membros gravados no documento.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `criar-equipe`, `montagem-equipe`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, ranking, escritas em `membro-index`, `aprovadoAte`, chat. Não recalcula nem grava `isCompleta`. Não muda `handleRecalcularCompletas` (papéis 1+1+2). Filtro `equipeContaNoResumo` da spec 013 permanece.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Completa no topo e no copy | `membros[0]`…`[3]` truthy | Contagem de entradas truthy (array ou mapa) `>= 4` |
| Tooltip M/E/F e botão copy | “4 membros” | “4 ou mais membros” |
| `isCompleta` / 1+1+2 | Não usado no topo | Continua não usado |
| Filtro 013 | Redes + id excluído | Inalterado |

## Firestore

**Leituras:** nenhuma nova. Reusa o scan admin já existente de `equipes` no mount de `TabEquipes`. Path de aluno/prova: zero full scan.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/admin/dashboard/page.jsx`
4. `specs/013-filtro-resumo-equipes-admin/spec.md`
5. `specs/013-admin-copia-resumo-completas/spec.md`

## Critérios de aceite

- [x] Completa = 4 ou mais membros gravados (array ou mapa, entradas truthy); não usar `isCompleta` nem papéis 1+1+2
- [x] Topo (públicas, M/E/F, privadas, completas) e o texto copiado usam a mesma regra
- [x] Tooltips do recorte M/E/F e do botão dizem “4 ou mais membros”
- [x] `equipeContaNoResumo` (redes + `LhT2fV3JvyQhZU8PrSFl`) permanece
- [x] Sem query em `membro-index`; sem write em `isCompleta`
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança de schema/rota

## Princípios da constitution aplicáveis

Free Tier (filtro local no scan admin existente); isolamento Firebase; escopo cirúrgico; SDD.
