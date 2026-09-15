# Spec: Fundo SVG no modal de recortes

| Campo | Valor |
|---|---|
| Slug | `019-fundo-modal-recortes` |
| Status | implementada |
| Firebase | nenhum |

## Problema / valor

No modal da tarefa, o painel da imagem usa fundo cinza (`#2A2A2A`). Os recortes passaram a ser transparentes. Com zoom-out, o cinza aparece ao redor. O painel deve ter **um** `fundo.svg` fixo (cover, sem zoom); só o recorte escala.

Spec 014 permanece a regra da tarefa (associação, entrega, pontos). Esta spec só cobre o visual do painel.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`) — mesmo modal
- [ ] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera pontuação, Firestore, auth, pins, frases, gabarito, entrega. Não altera `questao`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`. Não regenera SVGs. Não alinha a rota `recortes-flavio-tavares` vs slug 014. Overlay atrás do modal (`#5A5A5A`) permanece.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Painel do recorte | `bg-[#2A2A2A]`; um `<img>` do recorte com `scale(zoom)` | Um `fundo.svg` CSS cover (sem zoom) + recorte com `scale` |
| Recortes | SVGs transparentes no `public/`; código ignora `fundo.svg` | `FUNDO_SRC` em `config.js`; recortes 1–20 sobre o fundo |

## Firestore

**Leituras:** nenhuma nova. **Writes:** nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `specs/014-tarefa-migalhas-flavio-tavares/spec.md`
4. `src/app/tarefas/recortes-flavio-tavares/page.jsx`
5. `src/app/tarefas/recortes-flavio-tavares/config.js`

## Critérios de aceite

- [x] Painel do modal sem `#2A2A2A`; um único `fundo.svg` (CSS cover, sem zoom)
- [x] Zoom-out (até 0.5): espaço ao redor é esse fundo, sem segunda camada nem cinza
- [x] Zoom-in: só o recorte escala (`object-cover`, origem no centro)
- [x] Range de zoom 0.5–3 inalterado; overlay do modal inalterada
- [x] Cota Spark: nenhuma query nova
- [x] `npm run build` código 0
- [x] Docs em `/docs`: rota e schema inalterados

## Princípios da constitution aplicáveis

Escopo cirúrgico, Spark (zero Firestore), `'use client'` + `Suspense` já existentes, sem wrappers novos, imagens locais em `public`, integridade de build.
