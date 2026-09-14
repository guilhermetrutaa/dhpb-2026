# Spec: Tarefa recorte Migalhas / Flávio Tavares

| Campo | Valor |
|---|---|
| Slug | `014-tarefa-migalhas-flavio-tavares` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

A equipe precisa associar 20 números de uma imagem a 26 frases (A–Z). Rascunho persiste ao clicar na frase. Entrega única, imutável, pontua 1 por acerto (máx. 20). O cartão no resumo da fase deve refletir o status.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`) — mesmo acesso à prova que o aluno, se membro ativo
- [x] Admin principal — só cadastra título, URL e pontuação máxima (já existe)
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `questao`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`. Não cria UI admin de coordenadas. Não instala dependências. Não usa o Firebase de suporte.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Página da tarefa | Não existe `src/app/tarefas/**` | `/tarefas/migalhas-flavio-tavares` com query `equipeId`, `faseId`, `edicaoId` |
| Status no resumo | Lê só `respostas.tarefa` | Prefere `tarefa_{faseId}`, fallback `tarefa` |
| Pontos da tarefa | — | `pontosTarefa` = acertos vs gabarito no código; rascunho não incrementa `ni`/`di`/`df` |
| Entrega | — | `runTransaction` + `increment`; `entregue` imutável |

## Firestore

**Leituras** (aluno): `getDoc` de `equipes/{equipeId}`, `equipes/{equipeId}/respostas/tarefa_{faseId}`, `edicoes/{edicaoId}/fases/{faseId}`. Zero full scan. Escolas: nenhuma.

**Writes:** `runTransaction` + `increment`. Dual-write: subcoleção `respostas/tarefa_{faseId}` e mapas `equipes.respostas.tarefa_{faseId}` + `equipes.respostas.tarefa`; `pontuacoes/{faseId}` e `equipes.pontuacoes.{faseId}`; `df` só na entrega com delta ≠ 0. Impacto em `membro-index` / `aprovadoAte`: nenhum. Impacto em `df`: só no crédito da entrega.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/AI_PROMPT_TAREFAS.md`
4. `docs/DATABASE.md`
5. `src/app/resumo-fase/page.jsx`
6. `src/app/provas-antigas/recorte-iconografico/page.jsx`

## Critérios de aceite

- [x] Rota `/tarefas/migalhas-flavio-tavares` com `'use client'` + `Suspense`; sem os três params, erro e link ao resumo
- [x] Header/footer copiados da questão (não os do Figma)
- [x] Título = `fase.tarefa.titulo`; botão de PDF (link Drive no `config.js`)
- [x] 20 pins em % no código; 26 frases sem rótulo Recorte/Errada; clique na frase grava rascunho
- [x] Entregar só com 20 associações; segunda entrega aborta; fase `correcao` somente leitura
- [x] `pontosTarefa` = acertos limitados a `tarefa.pontuacao`; rascunho não mexe em `ni`/`di`/`df`
- [x] Resumo lê `tarefa_{faseId}` com fallback `tarefa`
- [x] Pastas `public/tarefas/migalhas-flavio-tavares/` (`imagem-central` + `recortes/`)
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs` atualizados (schema da resposta de tarefa + rota)

## Princípios da constitution aplicáveis

Free Tier (só `getDoc` no path da equipe/fase), isolamento Firebase (só `@/lib/firebase`), atomicidade (`runTransaction`/`increment`), `entregue` imutável, dual-write legado, `'use client'` + `Suspense`, sem wrappers novos, imagens locais em `public` (Cloudinary só se a URL for Cloudinary).
