# Spec: Crédito retroativo do recorte 13

| Campo | Valor |
|---|---|
| Slug | `028-admin-credito-recorte-13` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

O gabarito do recorte 13 da tarefa Flávio Tavares saiu errado. A 1ª fase já fechou. O admin precisa creditar 1 ponto só nas equipes completas que já entregaram a tarefa e erraram esse recorte, sem mudar o gabarito nem reabrir a prova.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `questao`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, `membro-index`, `aprovadoAte`, chat. Não muda `GABARITO`, `calcularPontosTarefa` nem a página da tarefa. Não altera `associacoes` nem `status` `entregue`. Não credita quem já acertou o 13, rascunho, incompleta ou a equipe de teste.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Recorte 13 errado após entrega | Peso fica sem o ponto | Admin simula e confirma +1 (teto da tarefa) |
| Quem já acertou `'P'` | Já tem o ponto | Sem +1 extra |
| Gabarito / entregas futuras | `GABARITO[13] = 'P'` | Intacto (fase fechada) |
| Segunda execução | — | Idempotente (`recorte13Bonificado` ou acerto já gravado) |

## Firestore

**Leituras:** `edicoes/{edId}/fases` com `orderBy('dataInicio')`; `equipes` `where('edicaoId','==',edId)`. Preview em memória. Path do participante: zero full scan. Escolas: nenhuma.

**Writes:** só após confirmar, e só equipes com delta ≠ 0. Por equipe: `runTransaction` + `increment` em `df`, `pontuacoes.{faseId}.ni/.di` e subcoleção `pontuacoes/{faseId}`; `set` merge em `respostas/tarefa_{faseId}` (`peso`, `recorte13Bonificado`) e mapas `respostas.tarefa_{faseId}` + `respostas.tarefa` se o legado for desta fase. `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/BUSINESS_RULES.md`
4. `src/app/admin/dashboard/page.jsx`
5. `src/app/tarefas/recortes-flavio-tavares/config.js`
6. `src/app/admin/firestore/ops.js`

## Critérios de aceite

- [x] Simular não grava; aborta se a edição não tiver fase com `tarefaUrl` de recortes/migalhas; copia a lista das equipes que mudam
- [x] Confirmar soma +1 só em completa (4+) com tarefa `entregue` que errou o recorte 13 e ainda não tem `recorte13Bonificado`
- [x] Quem acertou `'P'`, está no teto, é rascunho/incompleta ou é `LhT2fV3JvyQhZU8PrSFl` não muda
- [x] Dual-write preservado; `associacoes`/`status` intactos; `atualizadoPor` = `admin`
- [x] Segunda execução não muda nada
- [x] Gabarito e página da tarefa intactos
- [x] Cota Spark: `equipes` com `where edicaoId`; sem full scan no path do participante
- [x] `npm run build` código 0
- [x] Docs `BUSINESS_RULES.md` §1.4 com o crédito pontual

## Princípios da constitution aplicáveis

Free Tier (`where` na edição); atomicidade (`runTransaction` + `increment`); dual-write intacto; isolamento Firebase (só principal); SDD (spec 028); escopo cirúrgico (tarefa pública e gabarito intocados).
