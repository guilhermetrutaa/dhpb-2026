# Spec: Atualização de textos oficiais (regulamento e calendário)

| Campo | Valor |
|---|---|
| Slug | `003-atualizacao-textos-oficiais` |
| Status | implementada |
| Firebase | nenhum |

## Problema / valor

A Comissão enviou PDFs com cronograma novo (inscrições, fases online até 18h, gabaritos, resultado da 4ª fase) e microcorreções no edital. As páginas `/regulamento` e `/calendario` ainda mostram as datas originais; o chat de suporte também.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)
- [ ] Admin principal
- [x] Atendente (`SUPPORT_ADMIN_EMAILS`) — via conhecimento do bot

## Escopo negativo

Não altera `questao`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, `membro-index`, `aprovadoAte`, isolamento do chat, certificados, layout/header/footer, rotas ou schema. Não adiciona itens de cronograma que a timeline do calendário ainda não lista (publicação, impugnação, deferimento).

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Inscrições | 30/07/2026 a 01/09/2026 | 30/07/2026 a 10/09/2026, até 23h59 |
| Deferimento (§9.1.5, só regulamento) | 04/09/2026 | 12/09/2026 |
| Fases online 1–4 | Encerram 23h59; datas antigas | Encerram 18:00; datas dos PDFs |
| Resultado 4ª + convocação | até 30/10/2026 | até 04/11/2026 às 23h59 |
| Final e premiação | 05/12 e 06/12, 08:00–12:00 | inalterados |
| Microtexto edital | hífen medalhas, URL 7.4, Art. 40, ao(â), colchete 7.20 | alinhado ao PDF corrigido |
| Knowledge do chat | cronograma antigo | mesmas datas das páginas |

## Firestore

**Leituras:** nenhuma nova.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/regulamento/page.jsx`
4. `src/app/calendario/page.jsx`
5. `src/lib/support/ai/knowledge.js`
6. `docs/CODE_CONVENTIONS.md`

## Critérios de aceite

- [x] `/calendario` exibe as datas e horários dos PDFs (sem item 9.1.5)
- [x] `/regulamento` §9 e microcorreções 6.3, 7.4, 7.12, 7.19, 7.20 alinhados ao PDF; 10.2 permanece `3º DHPB`
- [x] Knowledge do suporte cita o mesmo cronograma (fases até 18:00)
- [x] Layout e classes das duas páginas permanecem iguais
- [x] Cota Spark: nenhuma query nova
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança de rota ou schema

## Princípios da constitution aplicáveis

Escopo cirúrgico; SDD caminho curto (UI/copy); isolamento Firebase (não mistura instâncias); Free Tier (zero Firestore).
