# Tasks: Filtro de cópia admin por fase

Uma responsabilidade por task. Sem cleanup cosmética no mesmo lote que regra de negócio.

Tasks que alteram `questao`, `membro-index`, `df` ou `aprovadoAte` ficam isoladas e exigem revisão humana antes de implementar.

| ID | Task | Arquivos | Pronto quando | Risco Firestore |
|---|---|---|---|---|
| T1 | Load de fases no mount + seletor (padrão `aberta`) | `src/app/admin/dashboard/page.jsx` | Dropdown preenchido; botões desabilitados se lista vazia | ~4 reads de fases no mount |
| T2 | `equipeComecouFase` e os três botões filtram edição+fase | `src/app/admin/dashboard/page.jsx` | Copy cita o nome da fase; sem fallback “qualquer chave” | 0 reads extras no filtro |

## Ordem

T1 → T2

## Validation

- [x] Critérios de `spec.md`
- [x] Checklist de `docs/CONSTITUTION.md`
- [x] `npm run build` no lote final
