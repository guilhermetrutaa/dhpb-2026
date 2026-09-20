# Spec: Número contínuo das questões entre fases

| Campo | Valor |
|---|---|
| Slug | `029-admin-numero-questao-continuo` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

As fases são capítulos da mesma prova. A 1ª fase usou os itens 1–9 (8 questões + 1 tarefa). A 2ª começa no 10 (até 17) e as seguintes continuam a conta. O painel admin só aceita número 1–10, então a fase 2 não consegue cadastrar a questão 11 em diante.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `questao`, `resumo-fase`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, `membro-index`, `aprovadoAte`, chat, pontuação, entrega (`runTransaction` / `increment`). Não calcula o próximo número a partir da fase anterior. Não exige unicidade de `numero` na fase. Não renumera questões já cadastradas. A tarefa continua no bloco separado (`fase.tarefa.titulo` / `tarefaUrl`).

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Campo número no admin | `min="1" max="10"`, placeholder `Número (1-10)` | `min="1"`, sem `max`, placeholder `Número` (ex.: 10, 11…) |
| Contador da lista | `Questões (N/10)` | `Questões (N)` |
| Persistência | `parseInt(numero)` sem teto no JS | Igual; o HTML deixa de bloquear > 10 |
| Prova do aluno | Exibe `questao.numero` | Intacto |

## Firestore

**Leituras:** nenhuma nova. Continua o `getDocs` filtrado da subcoleção `edicoes/{edicaoId}/fases/{faseId}/questoes` com `orderBy('numero')` já existente no admin. Path do participante: zero full scan. Escolas: nenhuma.

**Writes:** os mesmos `setDoc` / `updateDoc` do cadastro atual (`questoes/{qId}` + `questoesIndex`). Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/admin/questoes/page.jsx`
4. `docs/BUSINESS_RULES.md`
5. `docs/DATABASE.md`

## Critérios de aceite

- [x] Admin consegue gravar número ≥ 10 (ex.: 10–17 na fase 2); a lista mostra “Questão 10”, etc.
- [x] Fase 1 continua editável com números 1–8
- [x] Sem teto `/10` no título da lista
- [x] `/questao` e `/resumo-fase` intactos
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs` com a regra de numeração contínua

## Princípios da constitution aplicáveis

Free Tier (sem query nova); escopo cirúrgico (só UI do admin + docs); dual-write legado e entrega intocados; SDD (spec 029); `'use client'` / `Suspense` já existentes.
