# Spec: Busca flexível de equipes e relatório de incompletas (Glayds)

| Campo | Valor |
|---|---|
| Slug | `005-admin-busca-incompletas` |
| Status | implementada |
| Firebase | principal |

## Problema / valor

Admins de suporte precisam achar equipe sem copiar o nome com a grafia exata (maiúsculas, acentos, prefixo). A organização precisa enviar à Glayds, sob demanda, a lista de equipes incompletas por rede e por escola.

## Atores

- [ ] Estudante
- [ ] Professor (`documentoStatus`)
- [x] Admin principal
- [ ] Atendente (`SUPPORT_ADMIN_EMAILS`)

## Escopo negativo

Não altera `criar-equipe`, `montagem-equipe`, `AuthContext`, `firebase.js`, `firestore-rest.js`, `escolas-pb.json`, ranking, escritas em `membro-index`, `aprovadoAte`, chat de suporte. Não adiciona busca “contém no meio” do nome (exigiria scan a cada pesquisa). Não consulta a coleção `membro-index` para decidir incompletude.

## As-is vs to-be

| Regra | No código hoje | Depois desta spec |
|---|---|---|
| Busca de equipe por nome | `where nomeLower ==` (caixa baixa, acento e nome inteiro obrigatórios) | Prefixo em `nomeNormalized` (caixa/acento/espaços); fallback `nomeLower ==` se zero hits |
| Busca por ID/URL | `getDoc` + extração de `equipeId` | Inalterado |
| Relatório incompletas | Só total `isCompleta == true` no dashboard | Botão WhatsApp Glayds: incompletas (`isCompleta !== true`) por rede e escola |

## Firestore

**Leituras:** busca admin: `getDoc(equipes/{id})`; `equipes` `where nomeNormalized` prefixo + `limit(15)`; fallback `where nomeLower ==`. Relatório: no clique, `getDocsFromServer(collection(db, 'equipes'))` só admin (scan justificado: sob demanda). Path de aluno/prova: zero full scan. Escolas JSON: não usadas nesta feature.

**Writes:** nenhum. Impacto em `df` / `membro-index` / `aprovadoAte`: nenhum.

## Required reading

1. `docs/PROJECT_CONTEXT.md`
2. `docs/CONSTITUTION.md`
3. `docs/DATABASE.md`
4. `src/app/admin/firestore/page.jsx`
5. `src/app/admin/dashboard/page.jsx`

## Critérios de aceite

- [x] Prefixo do nome (com ou sem acento/caixa) encontra até 15 equipes via `nomeNormalized`; ID/URL continuam via `getDoc`
- [x] Equipes antigas sem `nomeNormalized` ainda batem no fallback `nomeLower ==`
- [x] Botão no dashboard abre WhatsApp com total + seções Estadual, Municipal, Federal, Privadas (`particular`); residual `publica` no fim; `Sem escola` se nome vazio
- [x] Incompleta = `isCompleta !== true` (falso ou campo ausente); sem query em `membro-index`
- [x] URL longa: texto completo no clipboard + resumo no wa.me
- [x] Cota Spark: nenhuma query nova sem filtro no path do participante
- [x] `npm run build` código 0
- [x] Docs: nota em `docs/KNOWN_ISSUES.md` sobre equipes sem `nomeNormalized`; sem mudança de schema/rota

## Princípios da constitution aplicáveis

Free Tier (prefixo+limit na busca; scan só admin no relatório); isolamento Firebase (só principal); escopo cirúrgico; SDD; `membro-index` não é reescrito.
