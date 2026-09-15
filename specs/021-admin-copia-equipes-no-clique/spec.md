# Spec: Copiar resumo de equipes só no clique

| Campo | Valor |
|---|---|
| Slug | `021-admin-copia-equipes-no-clique` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

Abrir a aba Equipes no admin varre todas as equipes e cobra leituras Spark mesmo quando o admin só quer ver a lista. Dois botões de cópia reusam esse scan automático. O admin precisa de um botão só: o scan caro e a cópia acontecem no clique; a abertura da aba permanece barata.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `criar-equipe`, `montagem-equipe`, `questao`, `admin/ranking`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, escritas em `membro-index`, `aprovadoAte`, chat. Não recalcula nem grava `isCompleta`. Não consulta `membro-index`. Não varre `equipes/{id}/respostas`. Ferramentas de manutenção da aba permanecem. Regras de completa (017), filtro de resumo (013) e “quem começou” (020) não mudam — só o gatilho e a UI de cópia.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Scan de todas as `equipes` | `getDocsFromServer(collection)` no mount de `TabEquipes` | Só no primeiro clique do botão de copiar; cliques seguintes reusam snapshot em memória |
| Totais no topo (públicas, M/E/F, privadas, completas) | Preenchidos no mount | Vazios até o clique; depois iguais às regras 013/017 |
| Botões de cópia | “Copiar resumo das completas” + “Copiar quem começou as provas” | Um botão “Copiar resumo” |
| Texto copiado | Dois cliques, dois textos | Um texto: bloco das completas (013) + bloco de quem começou (020) |
| Lista paginada e “N no servidor” | `edicoes` + count + `limit(50)` | Inalterado no mount |

## Firestore

**Leituras:** no mount, `getDocsFromServer(edicoes)` + `getCountFromServer(equipes)` + `getDocsFromServer(equipes)` com `orderBy(documentId())` e `limit(50)`. No primeiro clique do botão, `getDocsFromServer(collection(db, 'equipes'))` só admin (scan justificado: slots de `membros` e mapa `respostas` não são queryáveis). Cliques seguintes: 0 reads Firestore. Cidades: `/escolas-pb.json` (0 reads). Path de aluno/prova: zero full scan. `membro-index`: zero.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `src/app/admin/dashboard/page.jsx`
4. `specs/013-filtro-resumo-equipes-admin/spec.md`
5. `specs/013-admin-copia-resumo-completas/spec.md`
6. `specs/020-admin-equipes-comecaram-provas/spec.md`

## Critérios de aceite

- [x] Mount de `TabEquipes` não chama `getDocsFromServer(collection(db, 'equipes'))` sem `limit`
- [x] Topo: “N exibida(s) · M no servidor” no load; públicas/M/E/F/privadas/completas só após o clique
- [x] Um botão “Copiar resumo”; o segundo botão de quem começou as provas é removido
- [x] Primeiro clique: scan + preenche topo + copia bloco completas (013/017) e bloco quem começou (020, inclusive mensagem de zero)
- [x] Segundo clique: reusa snapshot; 0 `getDocs` extras da coleção `equipes`
- [x] Clipboard: `writeText`; sucesso com alert; falha mostra o texto no `prompt`
- [x] Sem query em `membro-index`; sem write em `isCompleta`
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs em `/docs`: sem mudança de schema/rota

## Princípios da constitution aplicáveis

Free Tier (scan admin só no clique, spec justifica); dataset estático de escolas; isolamento Firebase (só principal); escopo cirúrgico; SDD; `membro-index` não é lido nem reescrito.
