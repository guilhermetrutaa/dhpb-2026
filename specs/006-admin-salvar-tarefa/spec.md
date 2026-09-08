# Spec: Feedback ao salvar tarefa no admin e query no resumo

| Campo | Valor |
|---|---|
| Slug | `006-admin-salvar-tarefa` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

O admin clica em “Salvar Tarefa” e não vê sucesso nem erro (`catch` vazio). Sem `faseId`/`edicaoId` o write falha em silêncio. O cartão da tarefa no resumo não leva `equipeId`, `faseId` e `edicaoId`.

## Atores

- [x] Admin principal
- [ ] Estudante (só o href do cartão; sem página de tarefa nova)

## Escopo negativo

Não altera `questao`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`. Não cria `src/app/tarefas/**`. Não muda fórmula (`ni`/`di`/`df`). Não soma `tarefa.pontuacao` em `notaMaxima`.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Salvar tarefa | `updateDoc` + `catch {}` | Valida IDs; mostra sucesso/erro; `setDoc` merge se o doc não existir |
| Link da tarefa | `href={fase.tarefaUrl \|\| '#'}` | Path + `equipeId`, `faseId`, `edicaoId` |

## Firestore

**Leituras:** nenhuma nova. Path de aluno: zero full scan.

**Writes:** `updateDoc` (ou `setDoc` merge só `tarefa` + `tarefaUrl`) em `edicoes/{edicaoId}/fases/{faseId}`. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/PLAYBOOK-CORRECAO-ADMIN-TAREFA.md`
4. `src/app/admin/questoes/page.jsx`
5. `src/app/resumo-fase/page.jsx`

## Critérios de aceite

- [x] Sem `faseId`/`edicaoId`: mensagem, sem write
- [x] Sucesso: “Tarefa salva.”
- [x] Falha: texto do erro visível
- [x] Href do cartão inclui os três params
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [ ] `npm run build` código 0 — falhou por rotas FCM já quebradas (`fsSendFcm`), fora deste escopo
- [x] Schema/rota inalterados — sem mudança obrigatória em DATABASE.md

## Princípios da constitution aplicáveis

Escopo cirúrgico, Spark, `'use client'`/`Suspense` já existentes, sem wrappers novos.
