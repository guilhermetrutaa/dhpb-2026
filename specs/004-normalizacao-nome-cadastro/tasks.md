# Tasks: Normalizacao de nome e sobrenome no cadastro

Uma responsabilidade por task. Sem cleanup cosmetica no mesmo lote.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Criar artefatos SDD da feature (spec/plan/tasks) | `specs/004-normalizacao-nome-cadastro/*` | Pasta criada e documentos preenchidos com escopo e criterios | Nenhum |
| T2 | Normalizar e validar `nome`/`sobrenome` no cadastro | `src/app/cadastro/page.jsx` | Campos salvos sem espacos indevidos; erro amigavel se valor ficar vazio | Sem novas leituras/escritas |
| T3 | Normalizar termo de busca por nome no admin | `src/app/admin/firestore/page.jsx` | Busca por nome completo ignora espacos excedentes digitados | Sem novas leituras/escritas |
| T4 | Validar build e criterios da spec | `src/app/cadastro/page.jsx`, `src/app/admin/firestore/page.jsx` | `npm run build` codigo 0 e criterios funcionais conferidos | Sem impacto |

## Ordem

T1 -> T2 -> T3 -> T4

## Validation

- [ ] Criterios de `spec.md`
- [ ] Checklist de `docs/CONSTITUTION.md`
- [ ] `npm run build` no lote final
