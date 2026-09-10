# Tasks: Encerrar inscricoes com interruptor no admin

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Artefatos SDD | `specs/007-encerrar-inscricoes/*` | spec/plan/tasks/checklist preenchidos | nenhum |
| T2 | Helper + toggle admin | `src/lib/inscricoes.js`, `src/app/admin/dashboard/page.jsx` | Card visivel em qualquer aba; setDoc merge | 1 getDoc + 1 setDoc admin |
| T3 | Travar conta e criar equipe | cadastro, login, criar-equipe, cadastro-escola, home, home-professor | URL e botoes recusam; login permanece | 1 getDoc por visita |
| T4 | Travar membros e sala | montagem-equipe, sala-de-equipe | add/swap recusados; 4 slots entram | 1 getDoc por visita |
| T5 | Docs + build | DATABASE, BUSINESS_RULES, knowledge.js | criterios da spec; `npm run build` 0 | nenhum |

## Ordem

T1 → T2 → T3 → T4 → T5

## Validation

- [ ] Criterios de `spec.md`
- [ ] Checklist de `docs/CONSTITUTION.md`
- [ ] `npm run build` no lote final
