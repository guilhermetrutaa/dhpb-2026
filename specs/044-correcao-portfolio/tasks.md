# Tasks: Sistema de correção da tarefa Portfólio Artístico (fase 4)

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `df` ou o dual-write legado ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec + plan + tasks | `specs/044-correcao-portfolio/` | Artefatos SDD preenchidos | nenhum |
| T2 | Critérios e escala | `src/lib/criterios.js` | 47 critérios, pesos somam 100, `notaDe` com 100/75/50/25/0, IA zera | nenhum (sem I/O) |
| T3 | Correção pura | `src/lib/correcao.js` | Campus, distribuição estável, 3ª correção ≥ 20, veredito descarta a menor | nenhum (sem I/O) |
| T4 | Gravar nota | `src/lib/correcao.js` | Delta idempotente + `runTransaction` + `increment` em `df`/`ni`/`di` + dual-write | 1 transação por veredito |
| T5 | Gerar distribuição (admin) | `src/app/admin/dashboard/page.jsx` | Simular não grava; confirmar escreve `correcoes/fase4/distribuicao` | 1 query equipes/`edicaoId`; 1 + 2N writes |
| T6 | Login e cadastro | `src/app/correcao/page.jsx` | Entrar/criar conta, "manter conectado" ligado, header com a conta e sair | 1 write em `users/{uid}` no cadastro |
| T7 | Board | `src/app/correcao/page.jsx` | Aba por professor, 5 colunas, cards, sem dependência nova | 1 query `array-contains` + `limit` |
| T8 | Painel de correção | `src/app/correcao/page.jsx` | `PortfolioWall` à direita, 47 critérios à esquerda, soma automática, autosave | 1 `getDoc` da equipe; 1 write por salvamento |
| T9 | Docs + build | `docs/DATABASE.md`, `docs/BUSINESS_RULES.md` | Aceite da spec; `npm run build` 0 | nenhum |

## Ordem

T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9

## Validation

- [x] Critérios de `spec.md`
- [x] Asserts na lógica pura: pesos somam 100; escala por fator; 80/55 → 3ª correção; 80/55/70 → 75; 2 notas sem 3ª quando < 20; campus nunca se autoatribui; distribuição estável; `delta = 0` não grava; equipe de teste fora
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final

## Fora (próximas specs)

- Reexportar notas em CSV para a comissão.
- Painel de conferência do admin sobre as correções fechadas.