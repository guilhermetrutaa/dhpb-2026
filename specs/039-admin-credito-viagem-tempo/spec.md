# Spec: Crédito retroativo do gabarito da Viagem no Tempo (imagens 2 e 7)

| Campo | Valor |
|---|---|
| Slug | `039-admin-credito-viagem-tempo` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

O gabarito da tarefa Viagem no Tempo (fase 2) saiu errado em dois pontos: a **data da imagem 2** (Teatro Minerva, Areia) e o **local da imagem 7** (Praia Bela, Pitimbu). A pontuação é por faixa, então quem fez 0,00 no componente quebrado foi penalizado sem culpa. A fase já fechou. O admin precisa creditar 1,00 por item afetado, sem alterar o gabarito nem reabrir a prova.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `src/app/tarefas/viagem-no-tempo/config.js` (gabarito `FOTOS`), nem a página da tarefa, nem `imagens`, `status`, `associacoes`, `aprovadoAte`, `membro-index`, `questao`, `admin/ranking`, `admin/questoes`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, chat.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Gabarito img 2 (ano) e img 7 (local) | Errado no `config.js` | Intacto (fase fechada) |
| Equipe com 0,00 na data da img 2 | Sem crédito | Admin simula e confirma +1,00 |
| Equipe com 0,00 no local da img 7 | Sem crédito | Admin simula e confirma +1,00 |
| Equipe que acertou o componente | 1,00 | Sem crédito extra |
| Segunda execução | — | Idempotente (`imagem2AnoBonificado`, `imagem7LocalBonificado`) |

## Regras de crédito

Créditos independentes por equipe: pode receber 1,00, 2,00 ou 0,00.

| Item | Condição | Crédito |
|---|---|---|
| Imagem 2 — data | `imagens['2']` existe e `pontosAno(ano, FOTOS[1]) === 0` | 1,00 |
| Imagem 7 — local | `imagens['7']` existe e `pontosLocal(lat, lng, FOTOS[6]) === 0` | 1,00 |

Filtros comuns: `resposta.status === 'entregue'`; 4+ membros; fora `LhT2fV3JvyQhZU8PrSFl`; `delta ≠ 0` depois do teto (`fase.tarefa.pontuacao`, padrão 20).

## Firestore

**Leituras:** `edicoes/{edId}/fases` com `orderBy('dataInicio')`; `equipes` com `where('edicaoId','==',edId)`. Preview em memória. Path do participante: zero full scan. Escolas: nenhuma. Fase da tarefa = primeira com `tarefaUrl` contendo `viagem-no-tempo`.

**Writes:** só após confirmar, e só equipes com delta ≠ 0. Por equipe: `runTransaction` relendo o doc ao vivo + `increment` em `df`, `pontuacoes.{faseId}.ni/.di` (doc e mapa); `set` merge em `respostas/tarefa_{faseId}` com `peso` + os dois flags; mapas `respostas.tarefa_{faseId}` e `respostas.tarefa` se o legado for desta fase. `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/BUSINESS_RULES.md`
4. `src/lib/bonificarRecorte13.js`
5. `src/app/tarefas/viagem-no-tempo/config.js`
6. `src/app/admin/dashboard/page.jsx`

## Critérios de aceite

- [x] Simular não grava; aborta se a edição não tiver fase com `tarefaUrl` de viagem no tempo; copia a lista das equipes que mudam
- [x] Confirmar soma 1,00 por item, até o teto, só em completa (4+) com tarefa `entregue` e componente em 0,00
- [x] Quem tem 0,25/0,50/0,75/1,00 no componente, está no teto, é rascunho/incompleta ou é `LhT2fV3JvyQhZU8PrSFl` não muda
- [x] `imagens`, `status` e `associacoes` preservados; dual-write intacto; `atualizadoPor` = `admin`
- [x] Segunda execução não muda nada
- [x] `config.js` (gabarito) e página da tarefa intactos
- [x] Cota Spark: `equipes` com `where edicaoId`; sem full scan no path do participante
- [x] `npm run build` código 0
- [x] Docs `BUSINESS_RULES.md` §1.4 e `DATABASE.md` com o crédito pontual

## Princípios da constitution aplicáveis

Free Tier (`where` na edição); atomicidade (`runTransaction` + `increment`); dual-write intacto; `entregue` imutável; isolamento Firebase (só `@/lib/firebase`); SDD (spec 039); escopo cirúrgico (gabarito e página pública intocados).
