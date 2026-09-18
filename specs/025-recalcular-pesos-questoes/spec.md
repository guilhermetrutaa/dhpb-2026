# Spec: Recálculo de Ni/Di/Df após correção de pesos 0/1/4/5 → 0/2/8/10

| Campo | Valor |
|---|---|
| Slug | `025-recalcular-pesos-questoes` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

Questões da 1ª fase foram cadastradas com a escala antiga (0, 1, 4, 5). O 4º DHPB usa 0, 2, 8 e 10. Quem já entregou ficou com Ni/Di/Df pela escala antiga; só editar a questão no console não corrige o histórico (pontuação é incremental). O admin precisa simular e gravar o recálculo depois de corrigir as alternativas.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `questao`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, `membro-index`, `aprovadoAte`, chat, medalhas. Não muda a fórmula de entrega (`Di = Ni × peso`). Não dobra a tarefa. Não varrer `equipes` sem `where('edicaoId')`. Não rebaixa nem apaga respostas. Não muda `alternativa` nem `status` `entregue`.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Peso na entrega | `peso` da alternativa no momento da entrega | Igual; cadastro passa a 0/2/8/10 no console (fora desta spec) |
| Ni/Di/Df já gravados | Incremental; não acompanham edição da questão | Admin simula e confirma recálculo na aba Equipes |
| Tarefa | `peso` 0–20 na entrega | Intacto |
| Escala ainda antiga nas questões | Recalcularia errado | Simular aborta se as alternativas ainda forem 0/1/4/5 |

## Firestore

**Leituras:** `edicoes/{edId}/fases` com `orderBy('dataInicio')`; `edicoes/{edId}/fases/{faseId}/questoes` com `orderBy('numero')` (subcoleção pequena, `limit(50)`); `equipes` `where('edicaoId','==',edId)`. Preview em memória. Path do participante: zero full scan. Escolas: nenhuma.

**Writes:** só após confirmar, e só equipes com diferença. Por equipe: `runTransaction` lê o doc da equipe e grava `df`, mapa `pontuacoes.{faseId}.ni/.di`, mapa `respostas.{qId}.peso` (objetivas entregues), subcoleção `pontuacoes/{faseId}` e `respostas/{qId}.peso`. Set absoluto, não `increment`. `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/BUSINESS_RULES.md`
4. `src/lib/recalcularPontuacao.js`
5. `src/app/admin/dashboard/page.jsx`
6. `src/app/questao/page.jsx`

## Critérios de aceite

- [x] Simular não grava; aborta se as questões ainda estiverem na escala 0/1/4/5; copia a lista completa das equipes que mudam (clipboard / prompt)
- [x] Confirmar alinha Ni/Di/Df e `peso` das objetivas entregues à escala atual das questões
- [x] Tarefa inalterada; `alternativa`/`status`/`aprovadoAte`/`membro-index` intocados
- [x] Segunda execução não muda nada (idempotente)
- [x] Equipe de teste `LhT2fV3JvyQhZU8PrSFl` excluída
- [x] Cota Spark: `equipes` com `where edicaoId`; sem full scan no path do participante
- [x] `npm run build` código 0
- [x] Docs `BUSINESS_RULES.md` com a correção de cadastro

## Princípios da constitution aplicáveis

Free Tier (`where` na edição; subcoleção de questões limitada); atomicidade (`runTransaction` + dual-write); `entregue` não troca de alternativa; SDD (spec 025); escopo cirúrgico (`questao` intocado); isolamento Firebase (só principal).
