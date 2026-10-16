# Spec: Contagem de entrega da tarefa da Fase 4 (admin, aba Equipes)

| Campo | Valor |
|---|---|
| Slug | `045-admin-tarefa-fase4-entregas` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

A Fase 4 (Portfólio Artístico) encerrou. Das 250 equipes aprovadas pelo ranking para a Fase 4, o admin precisa saber **quantas entregaram a tarefa** e **quais não entregaram**, em um clique, com o resultado na área de transferência para pursue (escolas, orientadores, mensagens).

Hoje existe "Copiar quem começou a responder" (spec 020/024), que conta qualquer chave do mapa `respostas` na fase selecionada — não separa entrega de tarefa de rascunho, não sabe quem tinha direito à fase 4 e não mostra as equipes faltantes.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `questao`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, `membro-index`, `aprovadoAte`, chat, `/correcao` (spec 044). Não varre `equipes/{id}/respostas`. Não cria, edita ou apaga resposta. Não muda pontuação, dual-write, pesos nem ferramentas de manutenção. Não recalcula `df` nem distribui corretores.

## Decisões de escopo (com humano)

| Tema | Decisão |
|---|---|
| Base das equipes | `nivelIndex(aprovadoAte) >= nivelIndex('fase4')` — ou seja `fase4` e `fase_final`. `aprovadoAte` é o **nível liberado**, não a fase concluída: `sala-de-equipe` só abre a 4ª fase (índice 3) com `nivelIndex >= 3`, e o ranking filtra "aprovados_f4" do mesmo jeito. É exatamente o conjunto que o ranking gravou ao aprovar F3→F4, então a contagem bate com as 250. Sem filtro de 4 membros nem de `tipoEscola`: a aprovação do ranking não os exigiu, e filtrar aqui subtrairia equipes aprovadas. |
| O que é "entregou" | `respostaTarefaDaFase(equipe, faseId).status === 'entregue'`. Rascunho e `pendente` não contam. Reusa o contrato da spec 042 (`respostas.tarefa_{faseId}` + espelho legado). |
| Fase | **4ª fase da edição escolhida no seletor de fase**, índice 3 na ordem `orderBy('dataInicio')`. Independe de qual fase está selecionada no `<select>` — base e tarefa precisam ser da mesma fase, senão a contagem mente. Segue o precedente da spec 041 (botão travado na Fase 2). |
| Saída | Botão mostra `entregue/total` no rótulo depois do clique e copia contagem + nomes das duas listas. `prompt` só se a clipboard falhar. |

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Equipes da Fase 4 | Não há recorte por `aprovadoAte` na aba Equipes | `aprovadoAte` com nível ≥ `fase4`, da edição da fase |
| Entrega da tarefa da Fase 4 | Só visível em `/admin/firestore` › Respostas, uma equipe por vez | Botão devolve o total e as listas |
| Critério de entrega | `equipeComecouFase` (qualquer chave, qualquer `faseId`) | `respostas.tarefa_{fase4}` com `status === 'entregue'` |
| Equipe de teste | Excluída do resumo (`LhT2fV3JvyQhZU8PrSFl`) | Também excluída |
| Clique | — | Rótulo do botão passa a citar `entregue/total`; clipboard com as duas listas ordenadas `pt-BR`. Zero entregas: mensagem explícita |

## Firestore

**Leituras:** nenhuma query nova. A 4ª fase sai de `fasesCopia` (já carregado no mount com `orderBy('dataInicio')`, spec 024); o `tarefaUrl` passa a ser mapeado nesse mesmo snapshot, sem read extra. As equipes vêm do scan cacheado de `garantirScanEquipes()` (spec 021), disparado no primeiro clique de qualquer botão de cópia da barra. Path de aluno/prova: zero full scan. `membro-index`: zero.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte` / dual-write: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/admin/dashboard/page.jsx`
4. `specs/041-admin-contagem-item-c/spec.md`
5. `specs/042-tarefa-portfolio-artistico/spec.md`

## Critérios de aceite

- [x] Botão na barra de cópia da aba Equipes, ao lado de "Contar item C", com `title` explicando base e critério
- [x] Base = `aprovadoAte` com nível ≥ `fase4`, da edição da 4ª fase, excluindo `LhT2fV3JvyQhZU8PrSFl`; sem filtro de membros nem de rede
- [x] 4ª fase resolvida em memória (índice 3 da edição no seletor), sem leitura extra; aborta com `alert` se a edição tiver menos de 4 fases ou se o `tarefaUrl` não for o portfólio
- [x] Entregue = `respostaTarefaDaFase(data, faseId).status === 'entregue'` (inclui o espelho legado `respostas.tarefa`); rascunho não conta
- [x] Texto copiado: total na fase, quantas entregaram, quantas não, nome da fase e listas de nomes ordenadas `pt-BR` (`Entregaram` e `Não entregaram`)
- [x] Zero entregas: mensagem explícita e nenhum nome na seção de entregantes
- [x] Rótulo do botão mostra `entregue/total` após o clique; `copiarTexto` com `prompt` no fallback; erro com `err.message`
- [x] Reusa o scan cacheado; nenhum `getDocs(collection('equipes'))` novo
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança de schema/rota

## Princípios da constitution aplicáveis

Free Tier (filtro local sobre scan admin existente, queries filtradas com `limit`); duas instâncias Firebase (usa `@/lib/firebase`); escopo cirúrgico e diff mínimo; SDD; nenhuma escrita em `aprovadoAte`.