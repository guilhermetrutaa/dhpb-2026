# Spec: Copiar e-mails e telefones de orientadores de equipes incompletas

| Campo | Valor |
|---|---|
| Slug | `010-admin-copia-contatos-incompletas` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

O admin precisa disparar contato (e-mail / WhatsApp) só para professores orientadores cujas equipes ainda não têm os quatro slots de membros. Dois botões no dashboard copiam listas únicas (sem repetir professor em várias equipes).

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `criar-equipe`, `montagem-equipe`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, ranking, escritas em `membro-index`, `aprovadoAte`, chat. Não recalcula nem grava `isCompleta`. Não consulta `membro-index`. Não usa `collectionGroup` em `questionarios`.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Relatório incompletas | WhatsApp Glayds por escola/rede | Inalterado |
| Cópia de e-mails de orientadores | Não existe | Clipboard: e-mails únicos de `membros` com `papel === 'professor_orientador'` em equipes sem os quatro slots |
| Cópia de telefones | Não existe | Clipboard: `telefone` em `users/{uid}/questionarios/{edicaoId}` dos mesmos orientadores, únicos |

## Firestore

**Leituras:** no clique de cada botão, `getDocsFromServer(collection(db, 'equipes'))` só admin (scan justificado: sob demanda). Botão de telefone: `getDoc(users/{uid}/questionarios/{edicaoId})` por par único `uid + edicaoId`. Path de aluno/prova: zero full scan. `membro-index`: zero.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/DATABASE.md`
4. `src/app/admin/dashboard/page.jsx`
5. `specs/009-admin-glayds-quatro-membros/spec.md`

## Critérios de aceite

- [x] Incompleta = falta qualquer um de `membros[0]`…`[3]` (array ou mapa); não usar `isCompleta`
- [x] Orientador = `papel === 'professor_orientador'`; equipe sem esse papel não entra
- [x] E-mails: um por linha, unique por e-mail (trim + lowercase); só do array `membros`
- [x] Telefones: um por linha, unique por valor trimado; origem `users/{uid}/questionarios/{edicaoId}.telefone`; sem doc/sem campo: omitir
- [x] Alert com totais; no de telefone, quantos orientadores ficaram sem número
- [x] Sem query em `membro-index`; sem write; sem `collectionGroup`
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança de schema/rota

## Princípios da constitution aplicáveis

Free Tier (scan só admin no clique; `getDoc` pontual de questionário); isolamento Firebase (só principal); escopo cirúrgico; SDD; `membro-index` não é lido nem reescrito.
