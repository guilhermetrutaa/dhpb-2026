# Plan: Finalização da Fase 4 e encaminhamento das equipes

Traduz `spec.md` para o stack atual (Next.js 16 App Router, Firebase Spark).

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/app/sala-de-equipe/page.jsx` | Blocos finalista/não-finalista na área vazia quando Fase 4 encerrada; confirmar presença |
| `src/lib/encaminhamentoFinal.js` | Função pura de decisão do bloco + recorte de fases (testável) |
| `src/lib/encaminhamentoFinal.test.mjs` | Check mínimo da função pura (assert, sem framework) |
| `src/app/admin/final/page.jsx` | Upload do manual (Cloudinary → `edicoes.manualFinalistaUrl`) e lista de finalistas com presença |
| `src/app/admin/dashboard/page.jsx` | Botão "Final" no header |
| `docs/DATABASE.md`, `docs/PROJECT_CONTEXT.md` | Schema novo + rota |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`. Sala de Equipe reusa os getDoc/onSnapshot existentes. Admin reusa a query filtrada de `/admin/medalhas` (`where edicaoId`, `where aprovadoAte=='fase_final'`).

## Writes a preservar

Não toca transações de `df`/`ni`/`di` nem `aprovadoAte`. `presencaFinalConfirmada` é write pontual em `equipes` via `updateDoc`, sem dual-write. `manualFinalistaUrl` é write pontual em `edicoes`.

## Auth e UI

- Sala de Equipe: membro ativo (`authUser.uid`) já validado no onSnapshot; presença gravada com `authUser.email`.
- Admin: `localStorage 'admin-authenticated'` (padrão das páginas admin).
- `useSearchParams` já está sob `<Suspense>` na Sala de Equipe; `/admin/final` não usa searchParams.
- Cloudinary upload unsigned preset (`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`), mesmo fluxo de `enviar-documento`.

## Risco Spark

Fora da janela da 1ª fase. +1 getDoc já existente reaproveitado (manual), +1 updateDoc pontual por confirmação de presença (raro, só finalistas). Admin: 2 getDocs por abertura de página. Desprezível.

## Docs a atualizar

`docs/DATABASE.md` (campos `equipes.presencaFinalConfirmada*`, `edicoes.manualFinalistaUrl`), `docs/PROJECT_CONTEXT.md` (rota `/admin/final`).
