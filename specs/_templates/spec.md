# Spec: <titulo>

| Campo | Valor |
|---|---|
| Slug | `<nnn-slug>` |
| Status | rascunho \| aprovada \| implementada |
| Firebase | principal \| suporte \| nenhum |

## Problema / valor

<!-- O que muda para o usuário e por quê. Sem stack. -->

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [ ] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

<!-- Módulos que esta feature NÃO altera. Ver SDD_ADOPTION_PLAN §9. -->

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| | | |

## Firestore

**Leituras** (coleção, `where`/`limit`, listeners). Path de aluno/prova: zero full scan. Escolas: só `public/escolas-pb.json`.

**Writes:** `writeBatch` \| `runTransaction` \| `increment`. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum \| descrever.

## Required reading

<!-- 2–6 arquivos. Agente não explora fora desta lista salvo bloqueio. -->

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3.

## Critérios de aceite

- [ ] Comportamento:
- [ ] Cota Spark: nenhuma query nova sem filtro no path do participante
- [ ] `npm run build` código 0
- [ ] Docs em `/docs` atualizados se rota ou schema mudar

## Princípios da constitution aplicáveis

<!-- Free Tier, Cloudinary, isolamento Firebase, atomicidade, Suspense, segredos. -->
