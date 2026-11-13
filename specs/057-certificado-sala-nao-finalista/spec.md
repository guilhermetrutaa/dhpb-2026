# Spec: Certificado de participação para não-finalista na Sala de Equipe

| Campo | Valor |
|---|---|
| Slug | `057-certificado-sala-nao-finalista` |
| Status | implementada |
| Firebase | nenhum |

## Problema / valor

Com a Fase 4 encerrada e o resultado publicado, a Sala de Equipe mostra o bloco de não-finalista (spec 050) e esconde o botão "Baixar Certificado de Participação". A equipe eliminada fica sem acesso ao certificado.

## Atores

- [x] Estudante
- [x] Professor (`documentoStatus`)
- [ ] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera: `aprovadoAte`, pontuação (`ni`/`di`/`df`), `questao`, `membro-index`, página `/certificado`, bloco de finalista, botão de certificado de finalista/medalhista.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Bloco não-finalista (Fase 4 `finalizada` + publicado) | Mensagem + notas, sem certificado | Mensagem + botão de certificado de participação + notas |
| `aprovadoAte === 'fase4'` no bloco não-finalista | Sem certificado (não há fase seguinte) | Certificado da Fase 4 |
| Eliminada antes do encerramento da Fase 4 | Botão de certificado abaixo da timeline | Igual |

## Firestore

**Leituras:** nenhuma nova.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `specs/050-finalizacao-fase4-encaminhamento/spec.md`
4. `src/app/sala-de-equipe/page.jsx`
5. `src/app/certificado/page.jsx`

## Critérios de aceite

- [x] Não-finalista com Fase 4 encerrada e resultado publicado vê "Baixar Certificado de Participação (Fase N)", que abre `/certificado?equipeId=…&fase=N`
- [x] `aprovadoAte === 'fase4'` nesse bloco recebe certificado da Fase 4
- [x] Finalista não recebe o botão de participação
- [x] Eliminada antes do encerramento da Fase 4: comportamento atual
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança (rota e schema iguais)

## Princípios da constitution aplicáveis

Free Tier (zero leitura nova). Diff mínimo. Sem write em `aprovadoAte`.
