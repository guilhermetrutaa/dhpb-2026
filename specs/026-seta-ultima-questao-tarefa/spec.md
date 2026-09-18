# Spec: Seta da última questão → tarefa

| Campo | Valor |
|---|---|
| Slug | `026-seta-ultima-questao-tarefa` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

Na última questão da prova, a seta da direita fica apagada e não clicável. Quem está na questão 8 não consegue ir direto para a tarefa; precisa voltar ao resumo da fase. A tarefa já aparece no resumo e a página da tarefa já volta para a última questão pela seta da esquerda.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)
- [ ] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `criar-equipe`, `montagem-equipe`, `admin/ranking`, `admin/questoes/visualizar`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, `membro-index`, `aprovadoAte`, chat, pontuação, entrega (`runTransaction` / `increment`). Não muda a seta esquerda da questão 1. Não muda a página da tarefa.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Seta direita com próxima questão | Link para `/questao?questaoId=...` | Igual |
| Seta direita na última questão | Sem href; opacidade reduzida; não clicável | Se a fase tiver `tarefaUrl` válido, link para a tarefa com `equipeId`, `faseId` e `edicaoId` |
| Sem tarefa / `tarefaUrl` vazio / `#` | Seta desabilitada | Continua desabilitada |
| Seta esquerda da questão 1 | Desabilitada | Intacto |
| Admin visualizar | Só navega entre questões | Intacto |

## Firestore

**Leituras:** nenhuma nova. Continua o `onSnapshot` existente em `edicoes/{edicaoId}/fases/{faseId}` (já traz `tarefaUrl`). Path do participante: zero full scan. Escolas: nenhuma.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/questao/page.jsx`
4. `src/app/resumo-fase/page.jsx`
5. `src/app/tarefas/recortes-flavio-tavares/page.jsx`

## Critérios de aceite

- [x] Última questão + `tarefaUrl` válido: seta direita clicável leva à tarefa com `equipeId`, `faseId` e `edicaoId`
- [x] Questões intermediárias: seta direita continua indo à próxima questão
- [x] Sem tarefa / `tarefaUrl` vazio / `#`: seta direita continua desabilitada
- [x] Seta esquerda da questão 1 e admin visualizar intactos
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs` atualizados se rota ou schema mudar (não se aplica)

## Princípios da constitution aplicáveis

Free Tier (sem query nova); escopo cirúrgico (`questao` só no bloco de href da seta; transação de entrega intocada); dual-write legado preservado; SDD (spec 026); `'use client'` / `Suspense` já existentes.
