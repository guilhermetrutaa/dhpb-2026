# Spec: Tamanhos de camisa da final

| Campo | Valor |
|---|---|
| Slug | `053-tamanhos-camisa-final` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

Equipe finalista que confirmou presença precisa informar o tamanho de camisa de cada membro, uma vez. O admin precisa ler esses dados na aba Final e baixar um HTML com tabela.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera: pontuação (`ni`/`di`/`df`), `aprovadoAte`, `membro-index`, confirmação de presença, manual, autorização de viagem, questionário, certificado/medalha. Sem rota nova. Sem módulo sensível (`questao`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `AuthContext`, `firebase.js`).

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Tamanho de camisa | Não existe | Modal na sala, só com `presencaFinalConfirmada` |
| Envio | — | Uma vez por equipe. Segundo envio recusado |
| Quem entra | — | Cada membro ativo, professor incluso. Opções P, M, G, GG |
| Admin | Lista presença em `/admin/final` | Tamanho ao lado do membro, selo enviado/pendente, download HTML com tabela |

## Firestore

**Leituras:** Sala já escuta `equipes/{id}`. Admin já lê finalistas com `where('edicaoId')` + `where('aprovadoAte', '==', 'fase_final')`. A transação faz 1 leitura do mesmo doc no envio. Sem query nova no path do participante.

**Writes:** `runTransaction` em `equipes/{id}` grava só `tamanhosCamisa`. Recusa se o campo já existe ou se a presença não está confirmada. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/DATABASE.md` (§2.3 equipes)
4. `src/app/sala-de-equipe/page.jsx`
5. `src/app/admin/final/page.jsx`
6. `src/components/ModalQuestionarioEquipe.jsx`

## Critérios de aceite

- [x] Finalista sem presença confirmada: sem botão de tamanhos.
- [x] Com presença e sem envio: botão abre o formulário (nome da equipe + P/M/G/GG por membro ativo, professor incluso).
- [x] Envio grava `tamanhosCamisa` uma vez. Botão vira **Tamanhos enviados** e não reabre.
- [x] Segundo envio (clique duplo ou outro membro) não sobrescreve.
- [x] `/admin/final`: tamanho ao lado do membro, selo enviado/pendente, **Baixar tamanhos** (HTML com tabela e totais) só das equipes com presença confirmada.
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs` atualizados (schema)

## Princípios da constitution aplicáveis

Free Tier (1 leitura extra só no envio), banco principal, `'use client'` já presente, `useSearchParams` já sob `<Suspense>`. Diff mínimo. Sem Cloudinary.
