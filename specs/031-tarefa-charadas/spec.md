# Spec: Tarefa Charadas (fase 3)

| Campo | Valor |
|---|---|
| Slug | `031-tarefa-charadas` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

A equipe agrupa 20 enigmas na estante “Paraíba” em ordem cronológica (3 blocos / prateleiras). Cada ícone abre um detalhamento (comando da charada + duas opções). Rascunho persistente; uma entrega imutável. O cartão no resumo da fase reflete rascunho e entregue.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`) — mesmo acesso à prova que o aluno, se membro ativo
- [x] Admin principal — só cadastra título, URL `/tarefas/charadas` e pontuação máxima (já existe em `/admin/questoes`)
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `questao`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `admin/questoes`, `resumo-fase`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`. Não instala dependências. Não usa o Firebase de suporte. Não desenha `public/viagem-tempo/foto1.svg` (ausente).

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Página da tarefa fase 3 | Não existe `/tarefas/charadas` | `/tarefas/charadas` com query `equipeId`, `faseId`, `edicaoId` |
| Alocação | — | 3 prateleiras, capacidades 7 / 7 / 6; overflow recusa + aviso vermelho |
| Detalhamento | — | Clique no ícone: animação + comando + 2 opções + desenho da mídia |
| Pontuação | — | Placeholder: 1 ponto por slot gabarito (bloco + índice); teto `fase.tarefa.pontuacao`; opção A/B grava e não pontua até o PDF oficial |
| Entrega | — | Uma entrega; rascunho incompleto permitido; `entregue` imutável |
| Status no resumo | Já lê `tarefa_{faseId}` | Sem mudança no resumo; a página grava esse id |

## Firestore

**Leituras** (aluno): `getDoc` de `equipes/{equipeId}`, `equipes/{equipeId}/respostas/tarefa_{faseId}`, `edicoes/{edicaoId}/fases/{faseId}`. Zero full scan. Escolas: nenhuma.

**Writes:** `runTransaction` + `increment`. Dual-write: subcoleção `respostas/tarefa_{faseId}` e mapas `equipes.respostas.tarefa_{faseId}` + `equipes.respostas.tarefa`; `pontuacoes/{faseId}` e `equipes.pontuacoes.{faseId}`; `df` só na entrega com delta ≠ 0. Impacto em `membro-index` / `aprovadoAte`: nenhum. Impacto em `df`: só no crédito da entrega.

Campos extras no doc da resposta:

- `prateleiras`: `{ "1": [id, …], "2": [id, …], "3": [id, …] }`
- `enigmas`: `{ "e01": { opcao: "A" \| "B" \| null }, … }`

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/AI_PROMPT_TAREFAS.md`
4. `docs/DATABASE.md`
5. `src/app/tarefas/recortes-flavio-tavares/page.jsx`
6. `public/rascunho_tarefa.pdf`

## Critérios de aceite

- [x] Rota `/tarefas/charadas` com `'use client'` + `Suspense`; sem os três params (fora da prévia local), erro e link ao resumo
- [x] Header/footer da prova; título = `fase.tarefa.titulo`; teto = `fase.tarefa.pontuacao`
- [x] 20 ícones no estilo de `public/icone_enigma.jpeg`; clique abre detalhamento com animação
- [x] Detalhamento: comando em cima, desenho Super 8 / VHS / lata / DVD no traço das ilustrações da Keila, duas opções
- [x] Estante “Paraíba”, prateleiras 7 / 7 / 6; 8º (ou 7º na 3) recusado com mensagem vermelha
- [x] Alocação por clique (sem lib de drag-and-drop); ordem esquerda → direita; remover/reordenar enquanto não entregue
- [x] Botões empilhados: rascunho acima (`#C5A00A`), entregar abaixo (`#197400`); rascunho amarelo após salvar; entregar verde + UI travada após entrega
- [x] Entregar só com 20 alocados; `window.confirm`; segunda entrega aborta; fase `correcao` somente leitura
- [x] Entrega: `runTransaction` + `increment`; rascunho não incrementa `ni`/`di`/`df`
- [x] Status `rascunho`/`entregue` no cartão do resumo (mesmo id `tarefa_{faseId}`)
- [x] Pasta `public/tarefas/charadas/` (ícone + mídias leves)
- [x] Ajuste visual: ícones em grade simétrica 10 + 10 (sem overflow em 375 px)
- [x] Ajuste visual: estante em trapézio como no PDF (placa “Paraíba”, base), nichos fixos 7 / 7 / 6, paleta sépia
- [x] Ajuste visual: detalhamento no formato do PDF (comando em cima; ilustração dividida em duas metades clicáveis = opção A | opção B), mídias `midia-*.jpg` no traço sépia das ilustrações da Keila
- [x] Gabarito e textos em `config.js` são placeholder até os PDFs oficiais
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs` atualizados (schema `prateleiras`/`enigmas` + rota)

## Princípios da constitution aplicáveis

Free Tier (só `getDoc` no path da equipe/fase), isolamento Firebase (só `@/lib/firebase`), atomicidade (`runTransaction`/`increment`), `entregue` imutável, dual-write legado, `'use client'` + `Suspense`, sem wrappers novos, imagens locais em `public`.
