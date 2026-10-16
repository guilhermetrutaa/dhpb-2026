# Tasks: Contagem de entrega da tarefa da Fase 4

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Mapear `tarefaUrl` no snapshot de fases do mount e resolver a 4ª fase (índice 3) da edição do seletor, com guarda de `portfolio-artistico` | `src/app/admin/dashboard/page.jsx` | `fasesCopia` traz `tarefaUrl`; `resolverFase4` devolve a fase ou `null`, sem leitura extra | 0 |
| T2 | Função pura de contagem: base `nivelIndex(aprovadoAte) >= nivelIndex('fase4')`, edição da fase, sem equipe de teste, `respostaTarefaDaFase(...).status === 'entregue'`, nomes ordenados `pt-BR` | `src/app/admin/dashboard/page.jsx` | Devolve `{ total, entregues, naoEntregues }` sem estado nem query | 0 |
| T3 | Handler `handleContarTarefaFase4` com `garantirScanEquipes` + `aplicarStatsDoScan` + `copiarTexto`; rótulo do botão passa a mostrar `entregue/total` | `src/app/admin/dashboard/page.jsx` | Um clique: clipboard com contagem e as duas listas; `prompt` no fallback; `alert` de erro com `err.message` | Reusa o scan cacheado (spec 021); 0 reads novas |
| T4 | Botão na barra de cópia da aba Equipes, ao lado de "Contar item C", com `title` explicando base e critério | `src/app/admin/dashboard/page.jsx` | Botão desabilitado sem 4ª fase resolvida | 0 |

## Ordem

T1 → T2 → T3 → T4

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final