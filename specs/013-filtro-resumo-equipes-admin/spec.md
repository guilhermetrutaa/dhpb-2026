# Spec: Filtro do resumo de equipes no admin

| Campo | Valor |
|---|---|
| Slug | `013-filtro-resumo-equipes-admin` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

O resumo da aba Equipes (números na tela e texto do botão “Copiar resumo das completas”) inclui equipes sem rede municipal/estadual/federal (`tipoEscola` `publica` ou vazio) e a equipe de teste “OS TELEFONES HUMANOS”. Esses itens não devem entrar nos totais oficiais.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `criar-equipe`, `montagem-equipe`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, ranking, `membro-index`, `aprovadoAte`, chat. Não apaga documentos no Firestore. Não muda ferramentas de manutenção. Equipes só `publica` continuam na lista paginada.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Completas no resumo | Quatro slots; inclui `publica` e a equipe `LhT2fV3JvyQhZU8PrSFl` | Quatro slots **e** `equipeContaNoResumo` |
| Públicas | M + E + F + `publica` | Só M + E + F |
| Copy | Pode trazer “Sem classificação” | Só `Públicas: N (Municipal · Estadual · Federal)` |
| Lista de cards | Mostra a equipe excluída se vier na página | Omite `LhT2fV3JvyQhZU8PrSFl` |
| Count do servidor | Total bruto | Inalterado |

## Firestore

**Leituras:** nenhuma nova. Reusa o scan admin já existente de `equipes`. Path de aluno/prova: zero full scan.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/admin/dashboard/page.jsx`
4. `specs/009-admin-glayds-quatro-membros/spec.md`

## Critérios de aceite

- [x] `tipoEscola` `publica` ou vazio não entra em completas, públicas, privadas, cidades nem orientadores
- [x] `LhT2fV3JvyQhZU8PrSFl` não entra nos totais nem na lista de cards
- [x] Copy sem “Sem classificação”
- [x] `publicas` = municipal + estadual + federal
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança de schema/rota

## Princípios da constitution aplicáveis

Free Tier (filtro local no scan admin existente); isolamento Firebase; escopo cirúrgico; SDD.
