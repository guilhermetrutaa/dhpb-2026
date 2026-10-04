# Plan: Nota fixa 20 na tarefa da fase 3

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/lib/fixarNotaTarefaFase3.js` | Achar a 3ª fase, delta `20 - pesoAtual`, preview |
| `src/app/admin/dashboard/page.jsx` | Aba Equipes: simular / confirmar nas ferramentas de manutenção |
| `docs/BUSINESS_RULES.md` | Registrar a nota fixa |
| `specs/043-admin-nota-tarefa-fase3/` | Spec / plan / tasks |

## Reuso (sem duplicar)

`respostaTarefaDaFase` e `deveAtualizarLegadoTarefa` vêm de `@/lib/bonificarRecorte13`; `round2` e `EQUIPE_EXCLUIDA_RECALC_ID` de `@/lib/recalcularPontuacao`. O dashboard reaproveita `carregarContextoRecorte13` (mesmas duas queries). Sem filtro de 4 membros.

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

Admin: `equipes` `where('edicaoId','==',edId)`; fases `orderBy('dataInicio')`. Fase 3 = índice 2. Abortar se `tarefaUrl` não contiver `galeria-de-enigmas`.

## Writes a preservar

Dual-write legado (subcoleção `respostas`/`pontuacoes` + mapas em `equipes`) permanece. `increment` em `ni`/`di`/`df`. `set` merge só em `peso`, `atualizadoEm` e `atualizadoPor`. O mapa embutido espalha a resposta atual — senão `enigmas`, `prateleiras` e `sorteio` somem. Não grava `aprovadoAte` nem `membro-index`. Não altera questões.

## Auth e UI

- Página admin já usa `localStorage('admin-authenticated')` (padrão do dashboard).
- Sem `useSearchParams` novo.
- Sem Cloudinary.

## Risco Spark

Leituras: 1 query de equipes da edição + 1 de fases. Escritas só com delta ≠ 0 (3 writes cada). Segunda execução: 0 writes.

## Docs a atualizar

`docs/BUSINESS_RULES.md` §1.4. Sem campo novo em `DATABASE.md`.
