# Plan: Contagem de entrega da tarefa da Fase 4

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack novo.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/admin/dashboard/page.jsx` | Aba Equipes: resolver a 4ª fase, contar e copiar |
| `specs/045-admin-tarefa-fase4-entregas/` | Spec / plan / tasks / checklist |

## Reuso (sem duplicar)

- `respostaTarefaDaFase` de `@/lib/bonificarRecorte13` — já importado no dashboard; lê `tarefa_{faseId}` e o espelho legado.
- `nivelIndex` de `@/lib/eliminacaoFases` — import novo; é a mesma função usada pelo ranking e pela sala de equipe para ler `aprovadoAte`.
- `EQUIPE_EXCLUIDA_RESUMO_ID`, `garantirScanEquipes`, `aplicarStatsDoScan`, `copiarTexto`, `faseCopia` — já no escopo de `TabEquipes`.
- `tarefaUrl` entra no `map` de fases do `useEffect` (linha ~261); o mesmo snapshot já traz `faseId`, `nome` e `status`. Zero read extra.

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

Admin: nenhuma query nova. Reusa as fases do mount (spec 024) e o scan cacheado de `equipes` (spec 021).

## Writes a preservar

Nenhum write. `aprovadoAte`, `df`, `ni`/`di`, dual-write (`respostas` subcoleção + mapas em `equipes`) e `membro-index` ficam intocados — a feature só lê.

## Auth e UI

- Botão na mesma barra dos demais (padrão `text-xs`, `border-[#82181A]`, `disabled:opacity-50`).
- Estado local `contagemTarefa` só para o rótulo; sem `useSearchParams` novo, sem `<Suspense>` novo, sem Cloudinary.

## Risco Spark

Leituras: 0 novas. No pior caso o primeiro clique dispara o scan de ~600 leituras que a spec 021 já justifica. Escritas: 0.

## Docs a atualizar

Nenhum. Sem rota nova, sem campo novo, sem regra de pontuação — `DATABASE.md` e `BUSINESS_RULES.md` continuam válidos.