# Spec: Equipes que começaram as provas (admin)

| Campo | Valor |
|---|---|
| Slug | `020-admin-equipes-comecaram-provas` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

O admin precisa saber, na aba Equipes, quantas equipes já gravaram alguma resposta de prova e quais são os nomes — sem varrer subcoleções nem gastar leituras extras.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `questao`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, `membro-index`, `aprovadoAte`, chat. Não varre `equipes/{id}/respostas`. Não muda pontuação, dual-write nem ferramentas de manutenção. Questionário coletivo (`questionarioEquipe`) não conta.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Quem começou a prova | Não há botão nem lista | Botão na aba Equipes lista contagem + nomes |
| Critério | — | Mapa embutido `equipes.respostas` com qualquer chave (rascunho ou entregue, questão ou `tarefa_*`, qualquer fase) |
| Equipe de teste | Excluída do resumo (`LhT2fV3JvyQhZU8PrSFl`) | Também excluída desta lista |
| Clique | — | Copia contagem + nomes para a área de transferência; confirmação curta no `alert`. `prompt` só se a clipboard falhar. Zero: “Nenhuma equipe começou a responder as provas.” |

## Firestore

**Leituras:** nenhuma nova. Reusa o `getDocsFromServer(collection(db, 'equipes'))` já feito no `useEffect` de `TabEquipes`. Clique só lê estado em memória. Path de aluno/prova: zero full scan.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/admin/dashboard/page.jsx`
4. `specs/013-filtro-resumo-equipes-admin/spec.md`

## Critérios de aceite

- [x] Botão na aba Equipes, junto de “Copiar resumo das completas”
- [x] Conta equipe se `Object.keys(data.respostas)` > 0 (não array)
- [x] Não conta `questionarioEquipe` nem `LhT2fV3JvyQhZU8PrSFl`
- [x] Copia quantidade e nomes ordenados para a área de transferência; fallback `prompt`
- [x] Mensagem de zero equipes
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança de schema/rota

## Princípios da constitution aplicáveis

Free Tier (filtro local no scan admin existente); isolamento Firebase; escopo cirúrgico; SDD.
