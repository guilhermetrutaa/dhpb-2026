# Spec: Página pública do sistema de pontuação

| Campo | Valor |
|---|---|
| Slug | `052-sistema-pontuacao-publico` |
| Status | implementada |
| Firebase | nenhum |

## Problema / valor

Visitante precisa achar os PDFs oficiais de pontuação e de nota de corte a partir do menu institucional, ao lado de Regulamento.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)

## Escopo negativo

Não altera pontuação, `questao`, ranking, `membro-index`, `aprovadoAte`, Auth, Firebase nem os PDFs em si. Menus internos de prova/tarefa/admin ficam como estão.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Menu institucional | Termina em Regulamento | Item "Sistema de pontuação" logo depois |
| Documentos | PDFs só em `public/` | `/sistema-de-pontuacao` abre os dois |

## Firestore

**Leituras:** nenhuma. **Writes:** nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/CODE_CONVENTIONS.md`
4. `src/app/page.jsx`
5. `src/app/provas-antigas/page.jsx`

## Critérios de aceite

- [ ] Menu da página inicial mostra "Sistema de pontuação" depois de Regulamento
- [ ] `/sistema-de-pontuacao` abre os dois PDFs de `public/`
- [ ] Cota Spark: nenhuma query nova
- [ ] `npm run build` código 0
- [ ] Docs em `/docs` atualizados (rota nova na matriz §3.2)

## Princípios da constitution aplicáveis

Sem Firestore, sem segredo, sem Cloudinary. Página estática.
