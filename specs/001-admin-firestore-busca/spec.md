# Spec: Busca admin Firestore por ID de equipe e nome completo

| Campo | Valor |
|---|---|
| Slug | `001-admin-firestore-busca` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

Admins de suporte precisam achar uma equipe pelo ID usado em montagem-equipe (incluindo colar a URL) e achar uma pessoa pelo nome completo cadastrado. Hoje a ferramenta só aceita e-mail no campo de pessoa e falha quando o ID da equipe vem numa URL.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `montagem-equipe`, `criar-equipe`, `AuthContext`, `firebase.js`, `firestore-rest.js`, cadastro, schema de `users`, ranking, exclusão profunda de equipe, nem escritas em `membro-index` / `participacoes` (os botões de exclusão já existentes permanecem iguais).

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Busca de equipe | `getDoc` com o texto cru; URL quebra o ID | Extrai `equipeId` da URL/query; `getDoc`; fallback `nomeLower` só se o termo não veio de URL |
| Card da equipe | Sem atalho para montagem | Link “Abrir montagem” para `/montagem-equipe?equipeId={id}` |
| Busca de pessoa | Só e-mail; input `type="email"` | E-mail (se tiver `@`) **ou** nome completo (`nome` + `sobrenome`), `limit(15)` |
| Uma palavra só no nome | — | Validação, zero query |
| Homônimos | — | Lista até 15; escolha carrega os painéis atuais |

## Firestore

**Leituras:** `getDoc(equipes/{id})`; fallback `equipes` `where nomeLower ==` (já existia); `users` `where email ==` (já existia); `users` `where nome == AND sobrenome ==` com `limit(15)`; `users/{uid}/participacoes` e `getDoc(membro-index/{key})` por edição (já existiam no fluxo de e-mail). Path de aluno/prova: zero full scan. Escolas: não usadas.

**Writes:** nenhum write novo. Exclusões já existentes (`deleteDoc` em equipe / `membro-index` / `participacoes`) inalteradas. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum nas buscas novas.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/DATABASE.md`
4. `src/app/admin/firestore/page.jsx`
5. `src/app/cadastro/page.jsx`

## Critérios de aceite

- [x] Colar ID cru ou URL com `equipeId=` encontra a equipe via `getDoc`; link abre montagem-equipe
- [x] Nome completo (duas ou mais palavras) consulta `nome` + `sobrenome` com `limit(15)`; uma palavra não dispara query
- [x] E-mail com `@` continua o fluxo atual
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs: nota em `docs/KNOWN_ISSUES.md` (igualdade case/acento no nome); sem mudança de schema/rota

## Princípios da constitution aplicáveis

Free Tier (where/limit, sem scan de `users`); isolamento Firebase (só instância principal); escopo cirúrgico (um arquivo de código); SDD (spec/plan/tasks nesta pasta).
