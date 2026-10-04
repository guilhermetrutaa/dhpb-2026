# Spec: Nota fixa 20 na tarefa da fase 3

| Campo | Valor |
|---|---|
| Slug | `043-admin-nota-tarefa-fase3` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

A tarefa da fase 3 (Galeria de Enigmas) gravou nota variável. O admin precisa deixar **peso 20** nessa tarefa para toda equipe que já entregou, tirando o peso atual e gravando 20 no lugar. Quem não enviou não ganha. As questões da fase ficam como estão.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera a página nem o gabarito de `galeria-de-enigmas`, nem `questao`, `admin/ranking`, `aprovadoAte`, `membro-index`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, chat.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Peso da tarefa entregue na fase 3 | Nota calculada (0–20) | Admin simula e confirma peso 20 |
| Equipe que não entregou | Sem os 20 | Continua sem os 20 |
| Questões objetivas da fase 3 | Nota própria | Intactas |
| Segunda execução | — | Idempotente (peso já 20 → delta 0) |

## Regras

- Fase 3 = 3º documento de `edicoes/{edId}/fases` ordenado por `dataInicio`. Se `tarefaUrl` não contiver `galeria-de-enigmas`, aborta e não grava.
- Entra só `status === 'entregue'` em `tarefa_{faseId}` (ou mapa legado `respostas.tarefa` dessa fase).
- Sem filtro de 4 membros.
- Fora a equipe de teste `LhT2fV3JvyQhZU8PrSFl`.
- `delta = 20 - pesoAtual`. Não soma 20 em cima da nota que já existe.
- `deltaDi = delta × peso da fase`. `df` acompanha `di`.

## Firestore

**Leituras:** as mesmas de `carregarContextoRecorte13` — `edicoes/{edId}/fases` com `orderBy('dataInicio')`; `equipes` com `where('edicaoId','==',edId)`. Preview em memória. Path do participante: zero full scan. Escolas: nenhuma.

**Writes:** só após confirmar, e só equipes com delta ≠ 0. Por equipe: `runTransaction` relendo o doc ao vivo + `increment` em `df`, `pontuacoes.{faseId}.ni/.di` (doc e mapa); `set` merge em `respostas/tarefa_{faseId}` com `peso: 20`; mapa embutido espalha a resposta atual e só troca o peso (`enigmas`, `prateleiras`, `sorteio`, `status` permanecem). `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/BUSINESS_RULES.md`
4. `src/lib/bonificarViagemTempo.js`
5. `src/lib/bonificarRecorte13.js`
6. `src/app/admin/dashboard/page.jsx`

## Critérios de aceite

- [x] Simular não grava; aborta se não houver 3ª fase ou se ela não for a Galeria; copia a lista das equipes que mudam
- [x] Confirmar grava peso 20 só em quem entregou a tarefa da fase 3
- [x] Rascunho, quem não enviou, peso já 20 e `LhT2fV3JvyQhZU8PrSFl` não mudam
- [x] Questões da fase, `enigmas`, `prateleiras`, `sorteio` e `status` `entregue` preservados; dual-write intacto; `atualizadoPor` = `admin`
- [x] Segunda execução não muda nada
- [x] Página e gabarito da Galeria intactos
- [x] Cota Spark: `equipes` com `where edicaoId`; sem full scan no path do participante
- [x] `npm run build` código 0
- [x] `docs/BUSINESS_RULES.md` §1.4 com a nota fixa

## Princípios da constitution aplicáveis

Free Tier (`where` na edição); atomicidade (`runTransaction` + `increment`); dual-write intacto; `entregue` imutável; isolamento Firebase (só `@/lib/firebase`); SDD (spec 043); escopo cirúrgico (página e gabarito da Galeria intocados).
