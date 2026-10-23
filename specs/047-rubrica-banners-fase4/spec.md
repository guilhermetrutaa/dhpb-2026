# Spec: Rubrica nova da correção do portfólio (fase 4)

| Campo | Valor |
|---|---|
| Slug | `047-rubrica-banners-fase4` |
| Status | aprovada |
| Firebase | principal |

## Problema / valor

A planilha `src/app/correcao/atualização Avaliação_dos_Banners_DHPB.xlsx` troca critérios no meio da lista. Os ids `c1`…`c47` deixam de apontar para o mesmo texto. Correção já enviada não pode permanecer.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [ ] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)
- [x] Comissão corretora

## Escopo negativo

Não altera entrega do portfólio, distribuição, campus, 3ª correção, fórmula do veredito, `aprovadoAte`, `membro-index`. Não copia as fórmulas `IF` da planilha. Não zera `peso`/`ni`/`di`/`df` já gravados neste lote.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Blocos | 11, título 8, gramática 8, sem reflexão | 12, título 6, reflexão 4, gramática 6, soma 100 |
| Escala | 1 / 0,75 / 0,5 / 0,25 / 0 | A mesma |
| Correção salva | Vale para sempre | Só vale com `rubrica: banners-2026-10` |
| Rascunho | `correcao-rascunho:equipe:corretor` | Chave inclui a rubrica |

## Firestore

**Leituras.** As mesmas da spec 046. O descarte da rubrica antiga é no cliente, sobre o doc já lido.

**Writes.** `salvarCorrecao` e `salvarVeredito` gravam `rubrica`. Sem write novo de ranking neste lote.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/BUSINESS_RULES.md`
4. `src/lib/criterios.js`
5. `src/lib/correcao.js`
6. `src/app/correcao/page.jsx`
