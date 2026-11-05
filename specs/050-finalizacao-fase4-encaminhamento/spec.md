# Spec: Finalização da Fase 4 e encaminhamento das equipes

| Campo | Valor |
|---|---|
| Slug | `050-finalizacao-fase4-encaminhamento` |
| Status | aprovada |
| Firebase | principal |

## Problema / valor

Encerrada a Fase 4, a Sala de Equipe fica sem informação de encaminhamento. A equipe precisa saber se foi classificada para a final (e receber o manual do finalista + confirmar presença) ou não, com o detalhamento das notas das fases que disputou. O admin precisa subir o manual e ver quais equipes confirmaram presença.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera: lógica de pontuação (`ni`/`di`/`df`), `questao`, `membro-index`, correção da fase 4 (`/correcao`), e a gravação de `aprovadoAte` em `/admin/ranking` (apenas leitura de `aprovadoAte` na Sala de Equipe). Não remove o botão de certificado/medalha de finalista já existente.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Área vazia da Sala de Equipe com Fase 4 encerrada | Mostra só botão de certificado de participação (equipes eliminadas) | Finalista: botões manual + confirmar presença, mensagem de parabéns e notas de todas as fases. Não-finalista: mensagem e notas até a fase aprovada |
| Manual do finalista | Não existe | Upload admin (Cloudinary) salvo em `edicoes.manualFinalistaUrl` |
| Confirmação de presença na final | Não existe | `equipes.presencaFinalConfirmada` gravado por membro ativo; admin visualiza |

## Firestore

**Leituras:** Sala de Equipe já lê `equipes/{id}` (onSnapshot), `edicoes/{id}` (getDoc) e as fases (getDocs com `orderBy`). Passa a ler também `edicoes.manualFinalistaUrl` do mesmo getDoc (0 leituras extras). Admin `/admin/final`: `getDocs(equipes where edicaoId==X and aprovadoAte=='fase_final')` (reuso de `/admin/medalhas`) e `getDocs(edicoes orderBy createdAt)`. Sem full scan no path do participante.

**Writes:** `updateDoc(equipes/{id}, { presencaFinalConfirmada, presencaFinalConfirmadaEm, presencaFinalConfirmadaPor })` (1 write pontual, sem impacto em `df`/`aprovadoAte`/`membro-index`). `updateDoc(edicoes/{id}, { manualFinalistaUrl })` (admin). Upload do PDF via Cloudinary unsigned preset.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/BUSINESS_RULES.md` (§1.4 eliminação/aprovação)
4. `docs/DATABASE.md` (§2.2 edicoes, §2.3 equipes)
5. `src/app/sala-de-equipe/page.jsx`
6. `src/app/admin/medalhas/page.jsx`

## Critérios de aceite

- [ ] Fase 4 `finalizada` + `aprovadoAte === 'fase_final'`: 2 botões (manual, confirmar presença), mensagem de parabéns e detalhamento de notas de todas as fases.
- [ ] Fase 4 `finalizada` + não-finalista: mensagem de não-classificação e notas até a fase aprovada (`aprovadoAte`).
- [ ] Botão manual desabilitado quando `manualFinalistaUrl` ausente; abre o PDF da edição.
- [ ] Confirmar presença grava em `equipes` e botão vira "Presença confirmada" (via onSnapshot).
- [ ] `/admin/final`: sobe manual (Cloudinary) e lista finalistas com membros e status de presença.
- [ ] Cota Spark: nenhuma query nova sem filtro no path do participante
- [ ] `npm run build` código 0
- [ ] Docs em `/docs` atualizados (schema + rota)

## Princípios da constitution aplicáveis

Free Tier (sem full scan), Cloudinary unsigned preset (upload admin), isolamento do banco principal, `'use client'` + `<Suspense>` para `useSearchParams`, segredos fora do client (preset público já usado no projeto). Diff mínimo.
