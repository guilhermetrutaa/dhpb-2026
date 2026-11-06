# Spec: Autorização de viagem após confirmação de presença

| Campo | Valor |
|---|---|
| Slug | `051-docs-presenca-final` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

Equipe finalista confirma presença e ainda não recebe a autorização de viagem. O manual do finalista já existe. O admin precisa de um lugar para subir o Word. A equipe só vê o download depois de confirmar.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera: manual do finalista, pontuação (`ni`/`di`/`df`), `aprovadoAte`, `membro-index`, texto e gravação de `presencaFinalConfirmada`, questionário, certificado/medalha, bloco de não-finalista. Sem roteiro da final.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Downloads do finalista | Só o manual, para toda equipe finalista | Manual permanece. Autorização de viagem (Word) só com `presencaFinalConfirmada` |
| Upload admin | Só `edicoes.manualFinalistaUrl` | Também `autorizacaoViagemUrl` em `/admin/final` |
| URL ausente | Botão do manual visível e desabilitado | Mesmo padrão no botão da autorização |

## Firestore

**Leituras:** Sala de Equipe reusa o `getDoc(edicoes/{id})` já existente. Lê `autorizacaoViagemUrl` desse documento. 0 leituras extras. Sem query nova no path do participante.

**Writes:** `updateDoc(edicoes/{id}, { autorizacaoViagemUrl })`, só admin. Sem impacto em `df` / `membro-index` / `aprovadoAte`. Upload Cloudinary unsigned preset, pasta `dhpb/final`.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/DATABASE.md` (§2.2 edicoes)
4. `src/app/sala-de-equipe/page.jsx`
5. `src/app/admin/final/page.jsx`
6. `specs/050-finalizacao-fase4-encaminhamento/spec.md`

## Critérios de aceite

- [ ] Finalista sem presença confirmada: só manual e confirmar presença.
- [ ] Finalista com `presencaFinalConfirmada`: botão **Baixar autorização de viagem** na mesma fileira.
- [ ] URL vazia: botão visível e desabilitado.
- [ ] `/admin/final`: Word (`.doc`/`.docx`) grava `autorizacaoViagemUrl`. Outro tipo é recusado. Manual continua PDF.
- [ ] Cota Spark: nenhuma query nova sem filtro no path do participante
- [ ] `npm run build` código 0
- [ ] Docs em `/docs` atualizados (schema)

## Princípios da constitution aplicáveis

Free Tier (sem leitura extra), Cloudinary unsigned preset, banco principal, `'use client'` já presente, `useSearchParams` já sob `<Suspense>`. Diff mínimo.
