# Plan: Recálculo de Ni/Di/Df após correção de pesos

Traduz `spec.md` para o stack **atual** (Next.js 16 App Router, Firebase Spark). Não escolhe stack nova.

## Arquivos

| Arquivo | Motivo |
|---|---|
| `src/lib/recalcularPontuacao.js` | Diagnóstico da escala, Ni/Di/Df, diff de `peso` das objetivas |
| `src/app/admin/dashboard/page.jsx` | Aba Equipes: simular / confirmar nas ferramentas de manutenção |
| `docs/BUSINESS_RULES.md` | Registrar a correção de cadastro |
| `specs/025-recalcular-pesos-questoes/` | Spec / plan / tasks |

## Queries

Path do participante: 0 `getDocs(collection)` sem `where()`/`limit()`.

Admin: `equipes` `where('edicaoId','==',edId)`; fases `orderBy('dataInicio')`; questões `orderBy('numero')` + `limit(50)` por fase.

## Writes a preservar

Dual-write legado (subcoleção `pontuacoes`/`respostas` + mapas em `equipes`) permanece. Set absoluto de `ni`/`di`/`df` e de `respostas.{qId}.peso`. Não `increment`. Não grava `aprovadoAte` nem `membro-index`.

## Auth e UI

- Página admin já usa `localStorage('admin-authenticated')` (padrão do dashboard).
- Sem `useSearchParams` novo.
- Sem Cloudinary.

## Risco Spark

1ª fase em andamento. Leituras: 1 query de equipes da edição + fases + ~8 questões/fase. Escritas só nas equipes com diff. Preview mostra estimativa. Se passar de ~5k equipes alteradas, avisar cota 20k writes. Preferir horário calmo (transação relê o doc se houver entrega simultânea).

## Docs a atualizar

`docs/BUSINESS_RULES.md` §1.4.
