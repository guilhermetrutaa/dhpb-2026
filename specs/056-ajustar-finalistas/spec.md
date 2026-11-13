# Spec: Ajustar finalistas no admin

| Campo | Valor |
|---|---|
| Slug | `056-ajustar-finalistas` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

O admin precisa tirar equipes da final e colocar outras. Quem entra por esse caminho confirma presença a partir de 13/11/2026 às 8:00. O formulário de camisa só aparece depois dessa confirmação.

## Atores

- [x] Estudante
- [x] Professor
- [x] Admin principal
- [ ] Atendente

## Escopo negativo

Não mexe em `df`, `membro-index` nem no ranking automático. Não reabre presença para finalista antigo sem `convocacaoExtra`.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Lista da final | Só a convocação em lote | Também tirar uma equipe e buscar/colocar outra |
| Presença depois de 11/11 23:59 | Encerrada para todas | Equipe com `convocacaoExtra` confirma a partir de 13/11 8:00 |
| Camisa | Depois da confirmação e da meia-noite de 12/11 | Igual: só com presença confirmada |

## Firestore

**Leituras:** busca admin `equipes where nomeNormalized` com `limit(15)`, filtro da edição no cliente.

**Writes:** `updateDoc` de `aprovadoAte`. Entrada também grava `convocacaoExtra: true` e apaga a confirmação anterior. Sem `df` e sem `membro-index`.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/admin/final/page.jsx`
4. `src/app/sala-de-equipe/page.jsx`
5. `src/lib/prazoFinal.js`

## Critérios de aceite

- [x] Admin tira uma finalista (`aprovadoAte` volta a `fase4`).
- [x] Admin busca pelo nome e coloca na final com `convocacaoExtra`.
- [x] Antes de 13/11 8:00 essa equipe não confirma. A partir das 8:00 o botão aparece.
- [x] Formulário de camisa só com `presencaFinalConfirmada`.
- [x] Finalista antiga sem o marco continua com prazo encerrado.
- [x] `npm run build` código 0
