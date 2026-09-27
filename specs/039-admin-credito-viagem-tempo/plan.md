# Plan: Crédito retroativo do gabarito da Viagem no Tempo (imagens 2 e 7)

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/lib/bonificarViagemTempo.js` | Elegível, delta, preview idempotente |
| `src/app/admin/dashboard/page.jsx` | Aba Equipes: simular / confirmar nas ferramentas de manutenção |
| `docs/BUSINESS_RULES.md` | Registrar o crédito pontual |
| `docs/DATABASE.md` | Campos `imagem2AnoBonificado` / `imagem7LocalBonificado` |
| `specs/039-admin-credito-viagem-tempo/` | Spec / plan / tasks |

## Reuso (sem duplicar)

`equipeTemQuatroMembros`, `respostaTarefaDaFase` e `deveAtualizarLegadoTarefa` vêm de `@/lib/bonificarRecorte13`; `round2` e `EQUIPE_EXCLUIDA_RECALC_ID` de `@/lib/recalcularPontuacao`; `FOTOS`, `pontosAno` e `pontosLocal` do `config.js` da tarefa. O dashboard reaproveita `carregarContextoRecorte13` (mesmas duas queries) sem renomear — sem refator cosmética.

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

Admin: `equipes` `where('edicaoId','==',edId)`; fases `orderBy('dataInicio')`. Fase da tarefa = primeira com `tarefaUrl` contendo `viagem-no-tempo`.

## Writes a preservar

Dual-write legado (subcoleção `respostas`/`pontuacoes` + mapas em `equipes`) permanece. `increment` em `ni`/`di`/`df`. `set` merge só em `peso` e nos dois flags. `montarRespostaBonificadaViagemTempo` reconstrói a resposta preservando `imagens`, `status`, `peso`, `faseId` e `tipo` — sem isso o map sobrescreveria e apagaria as 10 respostas. Não grava `aprovadoAte` nem `membro-index`. Não altera `imagens` nem `status`.

## Auth e UI

- Página admin já usa `localStorage('admin-authenticated')` (padrão do dashboard).
- Sem `useSearchParams` novo.
- Sem Cloudinary.

## Risco Spark

Fase fechada. Leituras: 1 query de equipes da edição + 1 de fases. Escritas só nas elegíveis (3 writes cada). Segunda execução: 0 writes.

## Docs a atualizar

`docs/BUSINESS_RULES.md` §1.4 e `docs/DATABASE.md`.
