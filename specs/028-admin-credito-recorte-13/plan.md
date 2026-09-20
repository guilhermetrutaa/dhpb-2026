# Plan: Crédito retroativo do recorte 13

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/lib/bonificarRecorte13.js` | Elegível, delta, preview idempotente |
| `src/app/admin/dashboard/page.jsx` | Aba Equipes: simular / confirmar nas ferramentas de manutenção |
| `docs/BUSINESS_RULES.md` | Registrar o crédito pontual |
| `specs/028-admin-credito-recorte-13/` | Spec / plan / tasks |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

Admin: `equipes` `where('edicaoId','==',edId)`; fases `orderBy('dataInicio')`. Fase da tarefa = primeira com `tarefaUrl` contendo `recortes` ou `migalhas`.

## Writes a preservar

Dual-write legado (subcoleção `respostas`/`pontuacoes` + mapas em `equipes`) permanece. `increment` em `ni`/`di`/`df`. `set` merge só em `peso` e `recorte13Bonificado`. Não grava `aprovadoAte` nem `membro-index`. Não altera `associacoes`.

## Auth e UI

- Página admin já usa `localStorage('admin-authenticated')` (padrão do dashboard).
- Sem `useSearchParams` novo.
- Sem Cloudinary.

## Risco Spark

1ª fase fechada. Leituras: 1 query de equipes da edição + fases. Escritas só nas completas que erraram o 13 (~3 writes/equipe). Preview mostra estimativa. Segunda execução: 0 writes.

## Docs a atualizar

`docs/BUSINESS_RULES.md` §1.4.
