# Tasks: Fechamento do veredito da correção da fase 4

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `df` ou o dual-write legado ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Spec + plan + tasks | `specs/046-fechamento-veredito-correcao-fase4/` | Artefatos SDD preenchidos | nenhum |
| T2 | Mesclagem pura | `src/lib/correcao.js` | `mesclarCorrecao` soma `enviados`, guarda `criteriosPorCorretor`/`zeradosPorCorretor` e não toca o outro corretor | nenhum (sem I/O) |
| T3 | Decisão do veredito pura | `src/lib/correcao.js` | `decidirVeredito` cobre par, 3ª correção com trava de 4º corretor e veredito final | nenhum (sem I/O) |
| T4 | Campus fonte única | `src/lib/correcao.js`, `src/app/admin/dashboard/page.jsx` | Distribuição e 3ª correção usam `campusDaEquipe` com o mesmo índice de escolas | nenhum |
| T5 | Gravar correção em transação | `src/lib/correcao-firestore.js` | `salvarCorrecao` relê, mescla e grava o doc inteiro, devolvendo `notas`/`enviados` já somados | 1 transação por envio |
| T6 | Distribuição ao vivo | `src/lib/correcao-firestore.js`, `src/app/correcao/page.jsx` | `onSnapshot` no doc único; 3º corretor vê a fila sem reload | 1 read por snapshot |
| T7 | Fechamento do veredito | `src/app/correcao/page.jsx` | 2º envio fecha o par, divergência ≥ 20 designa o 3º, 3ª nota grava `peso`/`ni`/`di`/`df` | 1 transação por veredito |
| T8 | Aba travada (Opção A) | `src/app/correcao/page.jsx` | Só a aba do logado renderiza; `autor` = email; `<nav>` de 7 abas sai | nenhum |
| T9 | Rascunho local | `src/app/correcao/page.jsx` | Autosave em `localStorage`, limpo no envio, painel reidrata na montagem | nenhum (zero write no rascunho) |
| T10 | Descarte do layout da spec 044 | `src/lib/correcao.js` | Doc sem `criteriosPorCorretor` é reescrito do zero (notas de teste não sobrevivem) | nenhum |
| T11 | Regras do console | — (item manual) | Admin cola as regras revisadas no console | nenhum |
| T12 | Autotests | `src/lib/correcao.js` | Par, 3ª correção, 4º corretor barrado, veredito, mesclagem sem sobrescrita, descarte do legado, campus | nenhum |
| T13 | Docs | `docs/DATABASE.md`, `docs/BUSINESS_RULES.md`, `docs/KNOWN_ISSUES.md` | Schema e regra de acesso conferem com o código; item de regras do console registrado | nenhum |
| T14 | Validação | — | Critérios da spec + constitution + `npm run build` 0 | nenhum |

## Ordem

T1 → T2 → T3 → T4 → T5 → T6 → T7 → T8 → T9 → T10 → T11 → T12 → T13 → T14

## Fora (próximas specs)

- Painel de conferência do admin sobre os vereditos (quantos pares pendentes, divergências abertas, `aguardando-terceira` sem resposta) — é o que teria exposto o bug; hoje o admin só vê a distribuição.
- Lista de e-mails da comissão no admin, fechando o `tipo: 'corretor'` auto-declarado (`docs/KNOWN_ISSUES.md` §1.11).
- Reexportar as notas em CSV para a comissão.
- Fechamento manual de um veredito pelo admin (rede de segurança para um professor que sumir).

## Validation

- [x] Critérios de `spec.md`
- [x] Asserts na lógica pura: 2 notas fecham; 80/55 designa 3º fora do campus e fora dos 2 primeiros; 80/55/70 → 75; 90/75 fecha sem 3º; 3º já designado não escala 4º; mesclagem soma `enviados` e preserva os critérios do par anterior; campus oficial vence `equipe.cidade`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final