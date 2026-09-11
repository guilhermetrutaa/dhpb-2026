# Spec: Relatórios Glayds por quatro membros

| Campo | Valor |
|---|---|
| Slug | `009-admin-glayds-quatro-membros` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

Os botões WhatsApp da Glayds no dashboard admin usavam `isCompleta` (papéis 1+1+2, campo que pode estar desatualizado). Completa/incompleta passa a ser: a equipe tem `membros[0]`, `membros[1]`, `membros[2]` e `membros[3]`.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `criar-equipe`, `montagem-equipe`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, ranking, escritas em `membro-index`, `aprovadoAte`, chat. Não recalcula nem grava `isCompleta`. Não muda o badge “completas” do header (continua o count `isCompleta == true`). Não consulta `membro-index`.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Relatório incompletas | `isCompleta !== true` | Falta qualquer um de `membros[0]`…`[3]` |
| Relatório “Compartilhar com Glayds” | `totalCompletas` via `where('isCompleta','==',true)` | Count no scan: quatro slots truthy |

## Firestore

**Leituras:** no clique de cada botão, `getDocsFromServer(collection(db, 'equipes'))` só admin (scan justificado: sob demanda). Path de aluno/prova: zero full scan. `membro-index`: zero.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/DATABASE.md`
4. `src/app/admin/dashboard/page.jsx`
5. `specs/005-admin-busca-incompletas/spec.md`

## Critérios de aceite

- [x] Completa = `membros[0]` e `[1]` e `[2]` e `[3]` truthy (array ou mapa); incompleta = o contrário
- [x] Botão incompletas: mesmas seções por rede; filtro pelos quatro slots
- [x] Botão Glayds: “Equipes Completas” vem do scan do clique; demais totais do estado já carregado
- [x] Sem query em `membro-index`; sem write em `isCompleta`
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança de schema/rota

## Princípios da constitution aplicáveis

Free Tier (scan só admin no clique); isolamento Firebase (só principal); escopo cirúrgico; SDD; `membro-index` não é lido nem reescrito.
