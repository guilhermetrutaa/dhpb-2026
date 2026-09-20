# Spec: Tarefa Viagem no Tempo (fase 2)

| Campo | Valor |
|---|---|
| Slug | `030-tarefa-viagem-no-tempo` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

A equipe analisa 10 fotografias históricas, estima o ano e marca o local no mapa. Rascunho por foto; uma entrega imutável. Pontua até 20 (1 localização + 1 ano por foto, com aproximação). Localização = km ao ponto da foto (≤5 km = 1,00; ≤10 = 0,75; ≤20 = 0,50; ≤40 = 0,25), não município. O cartão no resumo da fase reflete rascunho e entregue.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`) — mesmo acesso à prova que o aluno, se membro ativo
- [x] Admin principal — só cadastra título, URL `/tarefas/viagem-no-tempo` e pontuação máxima 20 (já existe em `/admin/questoes`)
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `questao`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `admin/questoes`, `resumo-fase`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, demo `/provas-antigas/viagem-no-tempo`. Não instala dependências. Não usa o Firebase de suporte.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Página da tarefa fase 2 | Só demo em `/provas-antigas/viagem-no-tempo` | `/tarefas/viagem-no-tempo` com query `equipeId`, `faseId`, `edicaoId` |
| Pontuação | Demo local, GPS exato | Km ao `lat`/`lng` da foto (≤5 = 1,00; ≤10 = 0,75; ≤20 = 0,50; ≤40 = 0,25) + faixas de ano; teto `fase.tarefa.pontuacao` |
| Entrega | Por imagem na demo | Uma entrega da tarefa; rascunho por foto; `entregue` imutável |
| Status no resumo | Já lê `tarefa_{faseId}` | Sem mudança no resumo; a página grava esse id |

## Firestore

**Leituras** (aluno): `getDoc` de `equipes/{equipeId}`, `equipes/{equipeId}/respostas/tarefa_{faseId}`, `edicoes/{edicaoId}/fases/{faseId}`. Zero full scan. Escolas: nenhuma.

**Writes:** `runTransaction` + `increment`. Dual-write: subcoleção `respostas/tarefa_{faseId}` e mapas `equipes.respostas.tarefa_{faseId}` + `equipes.respostas.tarefa`; `pontuacoes/{faseId}` e `equipes.pontuacoes.{faseId}`; `df` só na entrega com delta ≠ 0. Impacto em `membro-index` / `aprovadoAte`: nenhum. Impacto em `df`: só no crédito da entrega.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/AI_PROMPT_TAREFAS.md`
4. `docs/DATABASE.md`
5. `src/app/tarefas/recortes-flavio-tavares/page.jsx`
6. `src/app/provas-antigas/viagem-no-tempo/page.jsx`

## Critérios de aceite

- [x] Rota `/tarefas/viagem-no-tempo` com `'use client'` + `Suspense`; sem os três params, erro e link ao resumo
- [x] Header/footer da prova; título = `fase.tarefa.titulo`; teto = `fase.tarefa.pontuacao`
- [x] Mapa + ano + pin; imagens `object-contain`; zoom com wheel sem scroll da página
- [x] Quadro (foto + mapa + ano), navegação 1–10 e botões de rascunho/entrega em tela cheia com fundo blur; a foto ainda tem tela cheia própria
- [x] Rascunho por foto persiste ano/local; um botão Entregar só com 10 rascunhos; alerta se clicar antes
- [x] Entrega: `runTransaction` + `increment`; segunda entrega aborta; fase `correcao` somente leitura
- [x] Tela “Tarefa entregue” + voltar ao resumo; status `rascunho`/`entregue` no cartão
- [x] Pasta `public/tarefas/viagem-no-tempo/` (`1.webp`–`10.webp`, webp)
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [ ] `npm run build` código 0
- [x] Docs em `/docs` atualizados (schema `imagens` + rota)

## Princípios da constitution aplicáveis

Free Tier (só `getDoc` no path da equipe/fase), isolamento Firebase (só `@/lib/firebase`), atomicidade (`runTransaction`/`increment`), `entregue` imutável, dual-write legado, `'use client'` + `Suspense`, sem wrappers novos, imagens locais em `public`.
