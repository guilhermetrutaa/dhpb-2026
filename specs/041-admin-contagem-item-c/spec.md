# Spec: Contagem do item C na questão 15 (admin, aba Equipes)

| Campo | Valor |
|---|---|
| Slug | `041-admin-contagem-item-c` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

O admin precisa saber, em um clique, quantas equipes completas marcaram **C** na questão 15 da fase selecionada (na prática, a fase 2), para auditar concordância de gabarito. Hoje não existe nenhuma ferramenta que leia a alternativa escolhida de uma questão específica.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `questao`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, `membro-index`, `aprovadoAte`, chat. Não varre `equipes/{id}/respostas`. Não cria, edita ou apaga resposta. Não muda pontuação, dual-write nem ferramentas de manutenção. Não toca a aba Equipes de `/admin/firestore` (CRUD) nem a aba Respostas.

## Decisões de escopo (com humano)

| Tema | Decisão |
|---|---|
| O que é "respondeu" | Apenas `status === 'entregue'`. Rascunho não conta. |
| Quais equipes | Equipes completas (4 ou mais membros) da edição da fase selecionada, excluindo a equipe de teste. Não exige `tipoEscola` público. |
| Fase | **Fase 2 fixa.** Resolvida em memória a partir de `fasesCopia` (já carregado): casa por `nome` (`Fase 2`, `2ª Fase`, `2`) ou `faseId === '2'`, preferindo a edição do seletor de fase. Zero leitura extra. `numero` 15 fixo no código. |
| Saída | `alert` com a contagem + botão que copia contagem e nomes; `prompt` só se a clipboard falhar. |

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Alternativa escolhida por questão | Só visível em `/admin/firestore` › Respostas, uma equipe por vez | Botão na barra de cópia da aba Equipes devolve o total |
| Critério | — | `respostas[questaoId]` com `status === 'entregue'` e `alternativa === 'C'` |
| Identificação da questão | — | Resolve `questaoId` pelo `numero === 15` dentro da Fase 2 (`questoes/{id}` com fallback ao array legado `fase.questoes`) |
| Participação na fase | — | Precisa ter ao menos uma resposta com `faseId` da fase (mesma regra de `equipeComecouFase`) |
| Equipe de teste | Excluída do resumo (`LhT2fV3JvyQhZU8PrSFl`) | Também excluída |
| Clique | — | `alert` curto + cópia da contagem e dos nomes ordenados. Zero: "Nenhuma equipe respondeu C na questão 15 desta fase." |

## Firestore

**Leituras:** `getDocsFromServer(query(collection(db,'edicoes',edId,'fases'), orderBy('dataInicio')))` e, para a fase escolhida apenas, `query(collection(db,'edicoes',edId,'fases',faseId,'questoes'), orderBy('numero','asc'), limit(50))` — mesma forma de `carregarContextoRecalc` (dashboard/page.jsx:397). Depois disso, apenas filtro em memória sobre o scan de `equipes` já cacheado por `garantirScanEquipes()` (dashboard/page.jsx:835). Nenhuma query no path do participante.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte` / dual-write: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/admin/dashboard/page.jsx`
4. `specs/020-admin-equipes-comecaram-provas/spec.md`
5. `specs/029-admin-numero-questao-continuo/spec.md`

## Critérios de aceite

- [x] Botão na barra de cópia da aba Equipes, travado na Fase 2 (independe do `<select>` de fase)
- [x] Fase 2 resolvida em memória por `fase.nome`/`faseId`, sem leitura extra; `alert` se não existir
- [x] Número da questão é constante única no código (`NUMERO_QUESTAO_ITEM_C = 15`)
- [x] Conta só `status === 'entregue'` com `alternativa === 'C'`
- [x] Só equipes de 4 ou mais membros, da edição da fase, excluindo `LhT2fV3JvyQhZU8PrSFl`
- [x] Exige participação na fase (qualquer resposta com o `faseId` da fase)
- [x] Resolve `questaoId` por `numero` com fallback ao array legado `fase.questoes`; erro claro se a questão não existir
- [x] `alert` com a contagem; cópia com contagem e nomes ordenados; fallback `prompt`; mensagem de zero equipes
- [x] Reusa o scan cacheado; nenhum `getDocs(collection('equipes'))` novo
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança de schema/rota

## Princípios da constitution aplicáveis

Free Tier (filtro local sobre scan admin existente, queries filtradas com `limit`); duas instâncias Firebase (usa `@/lib/firebase`); escopo cirúrgico e diff mínimo; SDD.
