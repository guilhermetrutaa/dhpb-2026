# Spec: Liberar montagem e acesso do professor

| Campo | Valor |
|---|---|
| Slug | `015-liberar-montagem-acesso-professor` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

A montagem de equipes existentes está fechada (não dá para adicionar/remover integrantes). Professores que já orientam equipes, ao clicar na edição, veem “inscrições encerradas” como se não tivessem equipe. Equipes com 5 membros no banco não veem o botão Sala de Equipe. Quem já está em equipe precisa montar, entrar na sala e fazer a prova; cadastro e criação de equipe nova continuam fechados.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)
- [ ] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `questao`, `criar-equipe` (página de criação), `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, ranking, `aprovadoAte`, chat. Não reabre `/cadastro`. Não apaga o 5º membro no Firestore. Não recalcula `isCompleta` em massa. Não migra `membro-index` de professores no dashboard.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Adicionar membro | `podeAddMembro = false` e `return` antecipado | Responsável ou professor orientador podem adicionar de novo |
| Criar equipe nova | Link “Criar Nova Equipe” na visão multi; home alerta encerrado | Home continua alerta se não houver equipe; link de criar some na montagem |
| Clique da edição (professor) | Só `participacoes` + `membro-index` (e-mail sem lower); senão alerta | Também `orientadorUids` / `criadorUid`; `membro-index` com e-mail lowercased |
| Pós-questionário | Sempre alerta encerrado | Repete o clique da edição |
| Remover professor | Apaga `participacoes` e `membro-index` da edição | Se ainda orientar outra equipe da edição, não apaga; atualiza `participacoes` |
| Sala de Equipe | Botão só com exatamente 4 membros (`=== 4` / `total === 0`) | Botão com **4 ou mais** membros ativos |

## Firestore

**Leituras:** `getDoc` de `participacoes`, `membro-index`, `equipes/{id}`; se professor não achar equipe: `equipes` `where orientadorUids array-contains uid` e, se preciso, `where criadorUid == uid` (já usadas na montagem). Remoção de professor: a mesma query `array-contains`. Path de aluno/prova: zero full scan. Escolas: nenhuma.

**Writes:** `setDoc`/`deleteDoc` em `participacoes` e `membro-index` no add/remove já existentes; heal de `participacoes` se ausente ao achar o professor via `orientadorUids`. Não reescreve `membro-index` de professor no heal (1:1 não cabe em multi-equipe). Dual-write de prova e `df`/`aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/BUSINESS_RULES.md`
4. `src/app/home-professor/page.jsx`
5. `src/app/montagem-equipe/page.jsx`
6. `src/app/home/page.jsx`

## Critérios de aceite

- [ ] Comportamento: montagem existente permite add/remove; professor na equipe entra em `/montagem-equipe`; sem equipe o alerta de inscrições encerradas permanece; 4+ membros ativos veem Sala de Equipe
- [ ] Cota Spark: nenhuma query nova sem filtro no path do participante
- [ ] `npm run build` código 0
- [ ] Docs em `/docs` atualizados (fluxo home e gap `membro-index` / >4 membros)

## Princípios da constitution aplicáveis

Free Tier (queries com `where`); unicidade `membro-index` de estudantes; isolamento Firebase; `'use client'` / Suspense já existentes; sem wrappers novos; diff mínimo.
