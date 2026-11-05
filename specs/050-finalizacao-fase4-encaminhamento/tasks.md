# Tasks: Finalização da Fase 4 e encaminhamento das equipes

Uma responsabilidade por task.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Função pura de decisão do bloco (finalista/não-finalista/nenhum) e recorte de fases | `src/lib/encaminhamentoFinal.js` | Retorna bloco correto por `fase4Status`/`aprovadoAte`; recorte de fases até `aprovadoAte` | 0 |
| T2 | Check mínimo da função pura | `src/lib/encaminhamentoFinal.test.mjs` | `node` roda asserts sem erro | 0 |
| T3 | Sala de Equipe: ler `manualFinalistaUrl`, renderizar blocos e confirmar presença | `src/app/sala-de-equipe/page.jsx` | Blocos conforme critérios; presença grava e reflete via onSnapshot | +1 updateDoc pontual (finalista) |
| T4 | Admin `/admin/final`: upload manual + lista de finalistas com presença | `src/app/admin/final/page.jsx` | Sobe PDF (Cloudinary), salva URL na edição, lista finalistas/membros/presença | 2 getDocs filtrados + 1 updateDoc |
| T5 | Botão "Final" no dashboard | `src/app/admin/dashboard/page.jsx` | Navega para `/admin/final` | 0 |
| T6 | Docs | `docs/DATABASE.md`, `docs/PROJECT_CONTEXT.md` | Campos e rota documentados | 0 |

## Ordem

T1 → T2 → T3 → T4 → T5 → T6

## Validation

- [ ] Critérios de `spec.md`
- [ ] Checklist de `docs/CONSTITUTION.md`
- [ ] `npm run build` no lote final
