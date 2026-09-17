# Spec: Filtro de cópia admin por fase

| Campo | Valor |
|---|---|
| Slug | `024-admin-filtro-copia-por-fase` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

Os três botões de cópia da aba Equipes tratam “começou a prova” como qualquer chave no mapa `respostas`. O admin precisa escolher a fase (1ª, 2ª, …) para listar quem já começou **essa** fase e as completas que ainda não a responderam — sem migrar o banco e com a prova rolando.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `questao`, `criar-equipe`, `montagem-equipe`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, dual-write, pontuação, `membro-index`, `aprovadoAte`, chat. Não varre `equipes/{id}/respostas`. Não reescreve respostas. Não muda ferramentas de manutenção. Topo (públicas / M/E/F / privadas / completas) permanece o recorte 013/017 de todas as edições. `questionarioEquipe` não conta.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Começou a prova | Qualquer chave em `equipes.respostas` | Valor do mapa com `faseId` igual à fase do seletor |
| Completas sem prova (023) | `!equipeComecouProva` (qualquer fase) | Mesmas regras 013/017 **e** `edicaoId` da fase **e** `!equipeComecouFase` |
| Fase alvo | Implícita (única fase aberta) | `<select>` ao lado dos três botões; padrão = `status === 'aberta'`, senão primeira por `dataInicio` |
| Sem fases | Botões sempre ativos | Botões de cópia desabilitados; não cai no critério antigo |

## Firestore

**Leituras:** no mount de `TabEquipes`, além de `edicoes` + count + `limit(50)`, um `getDocsFromServer(query(edicoes/{id}/fases, orderBy(dataInicio)))` por edição (~4 reads). Scan de `equipes` inalterado (spec 021, só no clique). Filtro de `faseId` só no cliente sobre o mapa embutido. Path de aluno/prova: zero full scan. `membro-index`: zero.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/admin/dashboard/page.jsx`
4. `specs/020-admin-equipes-comecaram-provas/spec.md`
5. `specs/023-admin-copia-completas-sem-prova/spec.md`
6. `specs/021-admin-copia-equipes-no-clique/spec.md`

## Critérios de aceite

- [x] Seletor lista fases por `dataInicio`; rótulo = nome da fase; se houver mais de uma edição, prefixar o nome da edição; valor `{edicaoId}/{faseId}`
- [x] Padrão: primeira fase com `status === 'aberta'`; senão a primeira da lista
- [x] Começou a fase = algum valor objeto em `respostas` com `faseId` igual ao selecionado (inclui tarefa pelo objeto, não só pela chave); string vazia não casa com fase nenhuma
- [x] Completas sem esta fase: 4+ membros + `equipeContaNoResumo` + `edicaoId` da fase + não começou a fase
- [x] Os três botões usam a mesma fase; textos/alerts citam o nome da fase
- [x] Sem fase na lista: botões de cópia desabilitados
- [x] Sem query em `membro-index`; sem write; sem varrer subcoleção `respostas`
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança de schema/rota

## Princípios da constitution aplicáveis

Free Tier (fases no mount admin; scan de equipes só no clique); isolamento Firebase; escopo cirúrgico; SDD; dual-write e `membro-index` intocados.
