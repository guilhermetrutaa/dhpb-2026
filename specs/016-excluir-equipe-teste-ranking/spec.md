# Spec: Excluir equipe teste do ranking

| Campo | Valor |
|---|---|
| Slug | `016-excluir-equipe-teste-ranking` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

A página admin de Ranking & Aprovação inclui a equipe de teste “OS TELEFONES HUMANOS”. Ela não deve aparecer na tabela nem ocupar vaga no preview de aprovação.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera dashboard (já filtra o mesmo id na spec 013), medalhas, certificados, `eliminacaoFases.js`, `criar-equipe`, `montagem-equipe`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, `membro-index`, dual-write de pontuação, chat. Não apaga o documento no Firestore.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Carga do ranking | Todas as equipes da edição | Omite `LhT2fV3JvyQhZU8PrSFl` |
| Tabela e filtros | Pode mostrar a equipe teste | Não aparece |
| Preview / `aprovadoAte` | Pode ocupar vaga e entrar no batch | Fora da lista carregada; batch existente inalterado |

## Firestore

**Leituras:** nenhuma nova. Reusa o scan admin já existente `equipes` com `where('edicaoId','==', edId)`. Path de aluno/prova: zero full scan.

**Writes:** nenhum write novo. `writeBatch` de `handleConfirmar` permanece. Impacto em `df` / `membro-index`: nenhum. A equipe excluída não entra no batch de `aprovadoAte`.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/admin/ranking/page.jsx`
4. `specs/013-filtro-resumo-equipes-admin/spec.md`

## Critérios de aceite

- [x] `LhT2fV3JvyQhZU8PrSFl` não aparece na tabela após selecionar a edição
- [x] Preview de aprovação não a lista nem a conta nas vagas
- [x] Query de equipes continua `where('edicaoId','==', edId)`
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança de schema/rota

## Princípios da constitution aplicáveis

Free Tier (filtro local no scan admin existente); isolamento Firebase; escopo cirúrgico; SDD; dual-write legado e `membro-index` intocados.
